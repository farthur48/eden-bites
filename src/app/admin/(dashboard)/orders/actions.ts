"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { dispatchPendingNotifications, enqueueOrderStatusNotifications } from "@/lib/notifications/service";
import { getOrderConfirmation } from "@/lib/orders/service";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/types/database";

const statuses: OrderStatus[] = ["new", "preparing", "out_for_delivery", "completed", "cancelled"];

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();

  const id = readUuid(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");

  if (!id || !statuses.includes(status as OrderStatus)) {
    redirect("/admin/orders");
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status, fulfilment_method, delivery_fee_status, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    redirect(`/admin/orders/${id}?updated=error`);
  }

  if (!isAllowedStatusTransition(order.status as OrderStatus, status as OrderStatus)) {
    redirect(`/admin/orders/${id}?updated=invalid`);
  }

  if (
    status === "completed" &&
    order.fulfilment_method === "delivery" &&
    order.delivery_fee_status === "pending"
  ) {
    redirect(`/admin/orders/${id}?updated=needs_fee`);
  }

  const currentPayment = ((order.payment_status as PaymentStatus | null) ?? "pending");
  const nextPaymentStatus: PaymentStatus =
    status === "cancelled" && currentPayment !== "paid" ? "cancelled" : currentPayment;

  const { error } = await supabase
    .from("orders")
    .update({ status: status as OrderStatus, payment_status: nextPaymentStatus })
    .eq("id", id);

  if (!error && (status === "out_for_delivery" || status === "completed")) {
    try {
      const { data: refRow } = await supabase.from("orders").select("reference").eq("id", id).maybeSingle();
      if (refRow?.reference) {
        const confirmation = await getOrderConfirmation(refRow.reference);
        if (confirmation) {
          await enqueueOrderStatusNotifications({
            orderId: id,
            confirmation,
            event: status === "out_for_delivery" ? "order_out_for_delivery" : "order_delivered",
          });
          void dispatchPendingNotifications({ orderId: id, limit: 10 }).catch((err) => {
            console.error("[notifications] dispatch_after_status_failed", { orderId: id, status, error: String(err) });
          });
        }
      }
    } catch (err) {
      console.error("[notifications] status_trigger_failed", { orderId: id, status, error: String(err) });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  redirect(`/admin/orders/${id}?updated=${error ? "error" : status}`);
}

function isAllowedStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    new: ["preparing", "out_for_delivery", "completed", "cancelled"],
    preparing: ["out_for_delivery", "completed", "cancelled"],
    out_for_delivery: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  return allowed[from].includes(to);
}

export async function updateDeliveryFeeAction(formData: FormData) {
  await requireAdmin();

  const id = readUuid(formData.get("orderId"));
  const rawFee = String(formData.get("deliveryFee") ?? "").trim();

  if (!id) {
    redirect("/admin/orders");
  }

  const feePesewas = parseGhsToPesewas(rawFee);

  if (feePesewas === null) {
    redirect(`/admin/orders/${id}?fee=invalid`);
  }

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, fulfilment_method, subtotal_pesewas")
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    redirect(`/admin/orders/${id}?fee=error`);
  }

  if (order.fulfilment_method !== "delivery") {
    redirect(`/admin/orders/${id}?fee=not-delivery`);
  }

  const finalTotal = order.subtotal_pesewas + feePesewas;
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      delivery_fee_pesewas: feePesewas,
      delivery_fee_status: "confirmed",
      total_pesewas: finalTotal,
    })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  redirect(`/admin/orders/${id}?fee=${updateError ? "error" : "saved"}`);
}

export async function resetDeliveryFeeAction(formData: FormData) {
  await requireAdmin();

  const id = readUuid(formData.get("orderId"));

  if (!id) {
    redirect("/admin/orders");
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, fulfilment_method, subtotal_pesewas")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.fulfilment_method !== "delivery") {
    redirect(`/admin/orders/${id}?fee=error`);
  }

  const { error } = await supabase
    .from("orders")
    .update({
      delivery_fee_pesewas: 0,
      delivery_fee_status: "pending",
      total_pesewas: order.subtotal_pesewas,
    })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  redirect(`/admin/orders/${id}?fee=${error ? "error" : "reset"}`);
}

export async function updatePaymentStatusAction(formData: FormData) {
  await requireAdmin();

  const id = readUuid(formData.get("orderId"));
  const paymentStatus = String(formData.get("paymentStatus") ?? "");

  if (!id || !["pending", "paid", "failed", "cancelled"].includes(paymentStatus)) {
    redirect("/admin/orders");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus as PaymentStatus })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  redirect(`/admin/orders/${id}?payment=${error ? "error" : "saved"}`);
}

function readUuid(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    trimmed,
  )
    ? trimmed
    : null;
}

function parseGhsToPesewas(value: string): number | null {
  if (!value) {
    return null;
  }

  const numeric = Number(value.replace(/,/g, ""));

  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100000) {
    return null;
  }

  return Math.round(numeric * 100);
}
