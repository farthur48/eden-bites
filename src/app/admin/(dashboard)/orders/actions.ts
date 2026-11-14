"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/database";

const statuses: OrderStatus[] = ["new", "preparing", "completed", "cancelled"];

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();

  const id = readUuid(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");

  if (!id || !statuses.includes(status as OrderStatus)) {
    redirect("/admin/orders");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: status as OrderStatus })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  redirect(`/admin/orders/${id}?updated=${error ? "error" : status}`);
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
