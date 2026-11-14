import "server-only";

import { formatDateTime, formatGhs } from "@/lib/format";
import type { OrderConfirmation } from "@/lib/orders/types";
import { getSmsServerConfig, normalizePhone } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type Channel = "dashboard" | "sms_business" | "sms_customer";
type NotificationRow = {
  id: string;
  order_id: string;
  channel: Channel;
  status: "pending" | "processing" | "sent" | "failed" | "skipped";
  recipient: string | null;
  payload: Json;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
};

const EVENT = "order_created";

export async function enqueueOrderNotifications(input: {
  orderId: string;
  confirmation: OrderConfirmation;
}): Promise<void> {
  if (!input.orderId) return;
  const supabase = createAdminClient();
  const payload = buildBusinessPayload(input.confirmation);
  const now = new Date().toISOString();

  const rows = [
    {
      order_id: input.orderId,
      channel: "dashboard" as const,
      event: EVENT,
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
    {
      order_id: input.orderId,
      channel: "sms_business" as const,
      event: EVENT,
      status: "pending" as const,
      recipient: getSmsServerConfig()?.businessTo ?? null,
      provider: "termii",
      payload: payload as unknown as Json,
      attempt_count: 0,
      max_attempts: 5,
      next_attempt_at: now,
    },
    {
      order_id: input.orderId,
      channel: "sms_customer" as const,
      event: EVENT,
      status: "skipped" as const,
      recipient: normalizePhone(input.confirmation.phone) || null,
      provider: "termii",
      payload: payload as unknown as Json,
      attempt_count: 0,
      max_attempts: 1,
      next_attempt_at: now,
      error_message:
        "Automated customer SMS is not enabled (requires consent/provider configuration).",
    },
  ];

  try {
    const { error } = await supabase.from("order_notifications").upsert(rows as never, {
      onConflict: "order_id,channel,event",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error("[notifications] enqueue_failed", { orderId: input.orderId, error: error.message });
    }
  } catch (error) {
    console.error("[notifications] enqueue_exception", { orderId: input.orderId, error: safeError(error) });
  }
}

export async function dispatchPendingNotifications(options?: {
  orderId?: string;
  limit?: number;
}): Promise<{ processed: number; sent: number; failed: number; skipped: number }> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  let query = supabase
    .from("order_notifications")
    .select("id,order_id,channel,status,recipient,payload,attempt_count,max_attempts,next_attempt_at")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(options?.limit ?? 10);
  if (options?.orderId) query = query.eq("order_id", options.orderId);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("[notifications] dispatch_query_failed", error.message);
    return { processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const summary = { processed: 0, sent: 0, failed: 0, skipped: 0 };
  for (const row of data as NotificationRow[]) {
    if (row.channel === "dashboard" || row.channel === "sms_customer") {
      summary.skipped += 1;
      continue;
    }
    summary.processed += 1;
    const result = await deliverBusinessSms(row);
    if (result === "sent") summary.sent += 1;
    else if (result === "failed") summary.failed += 1;
    else summary.skipped += 1;
  }
  return summary;
}

async function deliverBusinessSms(row: NotificationRow): Promise<"sent" | "failed" | "skipped"> {
  const supabase = createAdminClient();
  const config = getSmsServerConfig();
  const now = new Date().toISOString();

  if (!config) {
    await supabase
      .from("order_notifications")
      .update({
        status: "skipped",
        provider: "termii",
        error_message: "SMS not configured. Set SMS_NOTIFICATIONS_ENABLED=true and SMS_API_KEY/SMS_BUSINESS_TO.",
        updated_at: now,
      } as never)
      .eq("id", row.id);
    console.warn("[notifications] sms_not_configured", { notificationId: row.id, orderId: row.order_id });
    return "skipped";
  }

  if (row.attempt_count >= row.max_attempts) {
    await supabase
      .from("order_notifications")
      .update({ status: "failed", error_message: "Max delivery attempts reached.", updated_at: now } as never)
      .eq("id", row.id);
    return "failed";
  }

  const claim = await supabase
    .from("order_notifications")
    .update({ status: "processing", last_attempt_at: now, updated_at: now } as never)
    .eq("id", row.id)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  if (claim.error || !claim.data) return "skipped";

  try {
    const body = buildMessageFromPayload(row.payload);
    const to = row.recipient || config.businessTo;
    const response = await fetch(config.baseUrl + "/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        from: config.senderId,
        sms: body.slice(0, 1600),
        type: "plain",
        channel: config.channel,
        api_key: config.apiKey,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const message = sanitizeProviderError(data) || `SMS API error (${response.status})`;
      return await markFailed(row, message);
    }

    const code = String(data.code ?? "").toLowerCase();
    if (code && code !== "ok" && !code.includes("success")) {
      const message = sanitizeProviderError(data) || `SMS provider response: ${code}`;
      return await markFailed(row, message);
    }

    const providerMessageId =
      typeof data.message_id === "string"
        ? data.message_id
        : typeof data.messageId === "string"
          ? data.messageId
          : null;
    await supabase
      .from("order_notifications")
      .update({
        status: "sent",
        provider: "termii",
        provider_message_id: providerMessageId,
        attempt_count: row.attempt_count + 1,
        error_message: null,
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return "sent";
  } catch (error) {
    return await markFailed(row, safeError(error));
  }
}

async function markFailed(row: NotificationRow, message: string): Promise<"failed"> {
  const supabase = createAdminClient();
  const attemptCount = row.attempt_count + 1;
  const terminal = attemptCount >= row.max_attempts;
  await supabase
    .from("order_notifications")
    .update({
      status: "failed",
      attempt_count: attemptCount,
      error_message: message.slice(0, 300),
      next_attempt_at: terminal ? new Date().toISOString() : nextRetryAt(attemptCount),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", row.id);
  console.error("[notifications] sms_send_failed", { notificationId: row.id, attemptCount, terminal, message });
  return "failed";
}

export function buildBusinessPayload(confirmation: OrderConfirmation) {
  const lines = confirmation.items.map((item) => {
    const extras =
      item.options.length > 0
        ? " [" + item.options.map((o) => o.optionName + (o.pricePesewas ? " (" + formatGhs(o.pricePesewas) + ")" : "")).join(", ") + "]"
        : "";
    return item.quantity + " x " + item.productName + extras + " - " + formatGhs(item.lineTotalPesewas);
  });
  const feeStatus =
    confirmation.deliveryFeeStatus === "pending"
      ? "Pending"
      : confirmation.deliveryFeeStatus === "not_required"
        ? "Not required"
        : "Confirmed (" + formatGhs(confirmation.deliveryFeePesewas ?? 0) + ")";
  const message = [
    "New Eden Bites order " + confirmation.reference,
    "Time: " + formatDateTime(confirmation.createdAt),
    "Customer: " + confirmation.customerName,
    "Phone: " + confirmation.phone,
    "Fulfilment: " + confirmation.fulfilmentMethod,
    confirmation.fulfilmentMethod === "delivery"
      ? "Address: " + ([confirmation.address, confirmation.area].filter(Boolean).join(", ") || "N/A")
      : null,
    confirmation.directions ? "Directions: " + confirmation.directions : null,
    "Payment: " + formatPaymentLabel(confirmation.paymentMethod) + " (" + confirmation.paymentStatus + ")",
    "Items:",
    ...lines.map((l) => "- " + l),
    "Food subtotal: " + formatGhs(confirmation.subtotalPesewas),
    "Delivery fee: " + feeStatus,
    "Current/final total: " + formatGhs(confirmation.totalPesewas),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    event: EVENT,
    reference: confirmation.reference,
    createdAt: confirmation.createdAt,
    customer: { name: confirmation.customerName, phone: confirmation.phone },
    fulfilmentMethod: confirmation.fulfilmentMethod,
    deliveryAddress:
      confirmation.fulfilmentMethod === "delivery"
        ? [confirmation.address, confirmation.area].filter(Boolean).join(", ")
        : null,
    items: confirmation.items,
    subtotalPesewas: confirmation.subtotalPesewas,
    deliveryFeeStatus: confirmation.deliveryFeeStatus,
    totalPesewas: confirmation.totalPesewas,
    message,
  };
}

function buildMessageFromPayload(payload: Json): string {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
  }
  return "New Eden Bites order received.";
}

function formatPaymentLabel(method: string): string {
  return method.replace(/_/g, " ");
}

function nextRetryAt(attemptCount: number): string {
  const minutes = Math.min(30, Math.pow(2, Math.max(0, attemptCount)) * 2);
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function sanitizeProviderError(data: Record<string, unknown>): string | null {
  const error = data.error;
  if (typeof error === "object" && error !== null && !Array.isArray(error)) {
    const message = (error as Record<string, unknown>).message;
    return typeof message === "string" ? message.slice(0, 300) : null;
  }
  if (typeof data.message === "string") return data.message.slice(0, 300);
  return null;
}

function safeError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 300);
  return "Unknown notification error";
}
