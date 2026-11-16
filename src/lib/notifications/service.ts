import "server-only";

import nodemailer from "nodemailer";

import { formatDateTime, formatGhs, formatOrderStatus, formatPaymentMethod } from "@/lib/format";
import type { OrderConfirmation } from "@/lib/orders/types";
import { getEmailServerConfig, getSmsServerConfig, normalizePhone } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type Channel = "dashboard" | "sms_business" | "sms_customer" | "email_business" | "email_customer";
type OrderEvent = "order_placed" | "order_out_for_delivery" | "order_delivered";
type NotificationRow = {
  id: string;
  order_id: string;
  channel: Channel;
  event: string;
  status: "pending" | "processing" | "sent" | "failed" | "skipped";
  recipient: string | null;
  payload: Json;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
};

export async function enqueueOrderPlacedNotifications(input: {
  orderId: string;
  confirmation: OrderConfirmation;
}): Promise<void> {
  await enqueueOrderEventNotifications({ ...input, event: "order_placed" });
}

export async function enqueueOrderStatusNotifications(input: {
  orderId: string;
  confirmation: OrderConfirmation;
  event: OrderEvent;
}): Promise<void> {
  await enqueueOrderEventNotifications(input);
}

async function enqueueOrderEventNotifications(input: {
  orderId: string;
  confirmation: OrderConfirmation;
  event: OrderEvent;
}): Promise<void> {
  if (!input.orderId) return;
  const supabase = createAdminClient();
  const payload = buildPayload(input.confirmation, input.event);
  const now = new Date().toISOString();
  const sms = getSmsServerConfig();
  const email = getEmailServerConfig();
  const customerPhone = normalizePhone(input.confirmation.phone) || null;
  const customerEmail = input.confirmation.email?.trim() || null;

  const rows = [
    {
      order_id: input.orderId,
      channel: "dashboard" as const,
      event: input.event,
      status: "sent" as const,
      recipient: "admin_dashboard",
      provider: "supabase",
      payload: payload as unknown as Json,
      attempt_count: 1,
      max_attempts: 1,
      next_attempt_at: now,
      last_attempt_at: now,
      delivered_at: now,
    },
    buildSmsRow(input.orderId, input.event, "sms_business", sms?.businessTo ?? null, sms?.enabled ?? false, payload, now),
    buildSmsRow(
      input.orderId,
      input.event,
      "sms_customer",
      customerPhone,
      sms?.enabled ?? false,
      payload,
      now,
      !customerPhone ? "Customer phone number is missing." : null,
    ),
    buildEmailRow(input.orderId, input.event, "email_business", email?.businessTo ?? null, email?.enabled ?? false, payload, now),
    buildEmailRow(
      input.orderId,
      input.event,
      "email_customer",
      customerEmail,
      email?.enabled ?? false,
      payload,
      now,
      !customerEmail ? "Customer email address is missing." : null,
    ),
  ];

  try {
    const { error } = await supabase.from("order_notifications").upsert(rows as never, {
      onConflict: "order_id,channel,event",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error("[notifications] enqueue_failed", { orderId: input.orderId, event: input.event, error: error.message });
    }
  } catch (error) {
    console.error("[notifications] enqueue_exception", { orderId: input.orderId, event: input.event, error: safeError(error) });
  }
}

function buildSmsRow(
  orderId: string,
  event: OrderEvent,
  channel: "sms_business" | "sms_customer",
  recipient: string | null,
  enabled: boolean,
  payload: ReturnType<typeof buildPayload>,
  now: string,
  missingReason?: string | null,
) {
  const reason = missingReason ?? (!enabled ? "SMS notifications are not configured." : null);
  return {
    order_id: orderId,
    channel,
    event,
    status: reason ? ("skipped" as const) : ("pending" as const),
    recipient,
    provider: "hubtel",
    payload: payload as unknown as Json,
    attempt_count: 0,
    max_attempts: 5,
    next_attempt_at: now,
    error_message: reason,
  };
}

function buildEmailRow(
  orderId: string,
  event: OrderEvent,
  channel: "email_business" | "email_customer",
  recipient: string | null,
  enabled: boolean,
  payload: ReturnType<typeof buildPayload>,
  now: string,
  missingReason?: string | null,
) {
  const reason = missingReason ?? (!enabled ? "Email notifications are not configured." : null);
  return {
    order_id: orderId,
    channel,
    event,
    status: reason ? ("skipped" as const) : ("pending" as const),
    recipient,
    provider: "gmail",
    payload: payload as unknown as Json,
    attempt_count: 0,
    max_attempts: 5,
    next_attempt_at: now,
    error_message: reason,
  };
}

export async function dispatchPendingNotifications(options?: {
  orderId?: string;
  limit?: number;
}): Promise<{ processed: number; sent: number; failed: number; skipped: number }> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  let query = supabase
    .from("order_notifications")
    .select("id,order_id,channel,event,status,recipient,payload,attempt_count,max_attempts,next_attempt_at")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(options?.limit ?? 20);
  if (options?.orderId) query = query.eq("order_id", options.orderId);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("[notifications] dispatch_query_failed", error.message);
    return { processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const summary = { processed: 0, sent: 0, failed: 0, skipped: 0 };
  for (const row of data as NotificationRow[]) {
    if (row.channel === "dashboard") {
      summary.skipped += 1;
      continue;
    }
    summary.processed += 1;
    const result = await deliver(row);
    summary[result] += 1;
  }
  return summary;
}

async function deliver(row: NotificationRow): Promise<"sent" | "failed" | "skipped"> {
  if (row.channel === "sms_business" || row.channel === "sms_customer") return deliverSms(row);
  if (row.channel === "email_business" || row.channel === "email_customer") return deliverEmail(row);
  return "skipped";
}

async function claim(row: NotificationRow): Promise<boolean> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const claim = await supabase
    .from("order_notifications")
    .update({ status: "processing", last_attempt_at: now, updated_at: now } as never)
    .eq("id", row.id)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  return !claim.error && !!claim.data;
}

async function deliverSms(row: NotificationRow): Promise<"sent" | "failed" | "skipped"> {
  const supabase = createAdminClient();
  const config = getSmsServerConfig();
  const now = new Date().toISOString();
  if (!config) {
    await supabase.from("order_notifications").update({ status: "skipped", provider: "hubtel", error_message: "SMS notifications are not configured.", updated_at: now } as never).eq("id", row.id);
    return "skipped";
  }
  if (!row.recipient) {
    await supabase.from("order_notifications").update({ status: "skipped", provider: "hubtel", error_message: "SMS recipient is missing.", updated_at: now } as never).eq("id", row.id);
    return "skipped";
  }
  if (row.attempt_count >= row.max_attempts) {
    await supabase.from("order_notifications").update({ status: "failed", error_message: "Max delivery attempts reached.", updated_at: now } as never).eq("id", row.id);
    return "failed";
  }
  if (!(await claim(row))) return "skipped";

  try {
    const message = buildSmsMessageFromPayload(row.payload, row.channel);
    const url = new URL(config.baseUrl);
    url.searchParams.set("clientid", config.clientId);
    url.searchParams.set("clientsecret", config.clientSecret);
    url.searchParams.set("from", config.senderId);
    url.searchParams.set("to", row.recipient);
    url.searchParams.set("content", message.slice(0, 1600));

    const response = await fetch(url.toString(), { method: "GET" });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) return await markFailed(row, sanitizeProviderError(data) || `Hubtel SMS error (${response.status})`, "hubtel");

    const status = String(data.status ?? data.Status ?? "").toLowerCase();
    if (status && status !== "0" && !status.includes("success") && !status.includes("ok")) {
      return await markFailed(row, sanitizeProviderError(data) || `Hubtel SMS status: ${status}`, "hubtel");
    }

    const providerMessageId =
      typeof data.messageId === "string" ? data.messageId :
      typeof data.MessageId === "string" ? data.MessageId : null;
    await markSent(row, "hubtel", providerMessageId);
    return "sent";
  } catch (error) {
    return await markFailed(row, safeError(error), "hubtel");
  }
}

let mailer: ReturnType<typeof nodemailer.createTransport> | null = null;
function getMailer() {
  if (mailer) return mailer;
  const config = getEmailServerConfig();
  if (!config) return null;
  mailer = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  return mailer;
}

async function deliverEmail(row: NotificationRow): Promise<"sent" | "failed" | "skipped"> {
  const supabase = createAdminClient();
  const config = getEmailServerConfig();
  const now = new Date().toISOString();
  if (!config) {
    await supabase.from("order_notifications").update({ status: "skipped", provider: "gmail", error_message: "Email notifications are not configured.", updated_at: now } as never).eq("id", row.id);
    return "skipped";
  }
  if (!row.recipient) {
    await supabase.from("order_notifications").update({ status: "skipped", provider: "gmail", error_message: "Email recipient is missing.", updated_at: now } as never).eq("id", row.id);
    return "skipped";
  }
  if (row.attempt_count >= row.max_attempts) {
    await supabase.from("order_notifications").update({ status: "failed", error_message: "Max delivery attempts reached.", updated_at: now } as never).eq("id", row.id);
    return "failed";
  }
  if (!(await claim(row))) return "skipped";

  try {
    const transport = getMailer();
    if (!transport) throw new Error("Email transport unavailable.");
    const subject = buildSubjectFromPayload(row.payload, row.channel);
    const text = buildEmailMessageFromPayload(row.payload, row.channel);
    const info = await transport.sendMail({
      from: config.from,
      to: row.recipient,
      subject,
      text,
    });
    await markSent(row, "gmail", typeof info.messageId === "string" ? info.messageId : null);
    return "sent";
  } catch (error) {
    return await markFailed(row, safeError(error), "gmail");
  }
}

async function markSent(row: NotificationRow, provider: string, providerMessageId: string | null) {
  const supabase = createAdminClient();
  await supabase
    .from("order_notifications")
    .update({
      status: "sent",
      provider,
      provider_message_id: providerMessageId,
      attempt_count: row.attempt_count + 1,
      error_message: null,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", row.id);
}

async function markFailed(row: NotificationRow, message: string, provider: string): Promise<"failed"> {
  const supabase = createAdminClient();
  const attemptCount = row.attempt_count + 1;
  const terminal = attemptCount >= row.max_attempts;
  await supabase
    .from("order_notifications")
    .update({
      status: "failed",
      provider,
      attempt_count: attemptCount,
      error_message: message.slice(0, 300),
      next_attempt_at: terminal ? new Date().toISOString() : nextRetryAt(attemptCount),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", row.id);
  console.error("[notifications] send_failed", { notificationId: row.id, channel: row.channel, attemptCount, terminal, message });
  return "failed";
}

function buildPayload(confirmation: OrderConfirmation, event: OrderEvent) {
  const lines = confirmation.items.map((item) => {
    const extras = item.options.length > 0 ? " [" + item.options.map((o) => o.optionName).join(", ") + "]" : "";
    return `${item.quantity} x ${item.productName}${extras} - ${formatGhs(item.lineTotalPesewas)}`;
  });
  const feeStatus =
    confirmation.deliveryFeeStatus === "pending"
      ? "Pending"
      : confirmation.deliveryFeeStatus === "not_required"
        ? "Not required"
        : "Confirmed (" + formatGhs(confirmation.deliveryFeePesewas ?? 0) + ")";
  const title =
    event === "order_placed" ? "Order placed" :
    event === "order_out_for_delivery" ? "Order out for delivery" : "Order delivered";
  const statusText = formatOrderStatus(confirmation.status);
  const orderRef = confirmation.orderNumber || confirmation.reference;
  const base = [
    `Eden Bites: ${title}`,
    `Order: ${orderRef}`,
    confirmation.orderNumber ? `Reference: ${confirmation.reference}` : null,
    `Status: ${statusText}`,
    `Time: ${formatDateTime(confirmation.createdAt)}`,
    `Customer: ${confirmation.customerName}`,
    `Phone: ${confirmation.phone}`,
    confirmation.email ? `Email: ${confirmation.email}` : null,
    `Fulfilment: ${confirmation.fulfilmentMethod}`,
    confirmation.fulfilmentMethod === "delivery"
      ? `Address: ${[confirmation.address, confirmation.area].filter(Boolean).join(", ") || "N/A"}`
      : null,
    confirmation.directions ? `Directions: ${confirmation.directions}` : null,
    `Payment: ${formatPaymentMethod(confirmation.paymentMethod)} (${confirmation.paymentStatus})`,
    "Items:",
    ...lines.map((l) => "- " + l),
    `Food subtotal: ${formatGhs(confirmation.subtotalPesewas)}`,
    `Delivery fee: ${feeStatus}`,
    `Total: ${formatGhs(confirmation.totalPesewas)}`,
  ].filter(Boolean) as string[];

  const businessMessage = base.join("\n");
  const customerMessage = buildCustomerMessage(confirmation, event);
  return {
    event,
    title,
    reference: confirmation.reference,
    orderNumber: confirmation.orderNumber,
    status: confirmation.status,
    customer: { name: confirmation.customerName, phone: confirmation.phone, email: confirmation.email },
    message: businessMessage,
    sms_business: businessMessage,
    sms_customer: customerMessage,
    email_business: businessMessage,
    email_customer: customerMessage,
    subject_business: `${title} - ${orderRef}`,
    subject_customer: `${title} - ${orderRef}`,
  };
}

function buildCustomerMessage(confirmation: OrderConfirmation, event: OrderEvent): string {
  const first = confirmation.customerName.split(" ")[0] || "there";
  const orderRef = confirmation.orderNumber || confirmation.reference;
  if (event === "order_placed") {
    const feeNote = confirmation.deliveryFeeStatus === "pending" ? " Delivery fee/final amount will be confirmed shortly." : "";
    return `Hi ${first}, your Eden Bites order ${orderRef} has been placed (${formatOrderStatus(confirmation.status)}). Total: ${formatGhs(confirmation.totalPesewas)}.${feeNote}`;
  }
  if (event === "order_out_for_delivery") {
    return `Hi ${first}, your Eden Bites order ${orderRef} is out for delivery. We will reach you on ${confirmation.phone}.`;
  }
  return `Hi ${first}, your Eden Bites order ${orderRef} has been delivered/completed. Thank you for ordering from Eden Bites.`;
}

function buildSmsMessageFromPayload(payload: Json, channel: Channel): string {
  if (!isRecord(payload)) return "Eden Bites order update.";
  if (channel === "sms_customer" && typeof payload.sms_customer === "string") return payload.sms_customer;
  if (typeof payload.sms_business === "string") return payload.sms_business;
  if (typeof payload.message === "string") return payload.message;
  return "Eden Bites order update.";
}

function buildEmailMessageFromPayload(payload: Json, channel: Channel): string {
  if (!isRecord(payload)) return "Eden Bites order update.";
  if (channel === "email_customer" && typeof payload.email_customer === "string") return payload.email_customer;
  if (typeof payload.email_business === "string") return payload.email_business;
  if (typeof payload.message === "string") return payload.message;
  return "Eden Bites order update.";
}

function buildSubjectFromPayload(payload: Json, channel: Channel): string {
  if (!isRecord(payload)) return "Eden Bites order update";
  if (channel === "email_customer" && typeof payload.subject_customer === "string") return payload.subject_customer;
  if (typeof payload.subject_business === "string") return payload.subject_business;
  return "Eden Bites order update";
}

export function buildBusinessPayload(confirmation: OrderConfirmation) {
  return buildPayload(confirmation, "order_placed");
}

function nextRetryAt(attemptCount: number): string {
  const minutes = Math.min(30, Math.pow(2, Math.max(0, attemptCount)) * 2);
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function sanitizeProviderError(data: Record<string, unknown>): string | null {
  const err = data.error ?? data.Error ?? data.message ?? data.Message;
  if (typeof err === "object" && err !== null && !Array.isArray(err)) {
    const message = (err as Record<string, unknown>).message;
    return typeof message === "string" ? message.slice(0, 300) : null;
  }
  if (typeof err === "string") return err.slice(0, 300);
  return null;
}

function safeError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 300);
  return "Unknown notification error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
