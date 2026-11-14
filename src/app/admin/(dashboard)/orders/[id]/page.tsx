import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { getOrderDetail } from "@/lib/data/orders";
import { getBusinessSettings } from "@/lib/data/settings";
import { formatDateTime, formatGhs, formatOrderStatus } from "@/lib/format";
import { phoneHref, whatsappHref } from "@/lib/site-config";
import type { Json, OrderStatus } from "@/types/database";

import {
  resetDeliveryFeeAction,
  updateDeliveryFeeAction,
  updateOrderStatusAction,
} from "../actions";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

function statusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "new":
      return "warning";
    default:
      return "default";
  }
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; fee?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [detail, settings] = await Promise.all([getOrderDetail(id), getBusinessSettings()]);

  if (!detail) notFound();

  const { order, items } = detail;
  const notifyWhatsapp = settings?.notify_whatsapp ?? false;
  const isDelivery = order.fulfilment_method === "delivery";
  const feePending = isDelivery && order.delivery_fee_status === "pending";
  const customerMessage = buildCustomerMessage(order);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand-green-deep">
            <ArrowLeft className="size-4" /> Back to orders
          </Link>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep">
            {order.reference}
          </h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
          <Badge variant="outline"><span className="capitalize">{order.fulfilment_method}</span></Badge>
        </div>
      </div>

      {query.updated ? (
        <p className={query.updated === "error" ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"}>
          {query.updated === "error" ? "The order status could not be updated." : `Order marked as ${formatOrderStatus(query.updated)}.`}
        </p>
      ) : null}
      {query.fee ? (
        <p className={query.fee === "saved" || query.fee === "reset" ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"}>
          {query.fee === "saved" ? "Delivery fee saved." : query.fee === "reset" ? "Delivery fee reset to pending." : "Could not update delivery fee."}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <section className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-brand-green-deep">Customer Information</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Name</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Phone</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{order.customer_phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Email</dt>
                <dd className="mt-1 text-sm text-foreground">{order.customer_email || "Not provided"}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={phoneHref(order.customer_phone)} className={buttonStyles({ variant: "outline", size: "sm" })}>
                <Phone className="size-4" /> Call
              </a>
              {notifyWhatsapp ? (
                <a href={`${whatsappHref(order.customer_phone)}?text=${encodeURIComponent(customerMessage)}`} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "accent", size: "sm" })}>
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
            <div className="border-b border-border/70 px-5 py-4 sm:px-6">
              <h2 className="font-display text-xl font-bold text-brand-green-deep">Meal Information</h2>
            </div>
            <ul className="divide-y divide-border/70">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.quantity} × {item.product_name}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatOptions(item.options)}</p>
                    {item.special_instructions ? <p className="mt-1 text-xs text-muted">Note: {item.special_instructions}</p> : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-brand-green-deep">{formatGhs(item.line_total_pesewas)}</p>
                    <p className="text-xs text-muted">{formatGhs(item.unit_price_pesewas)} each</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-brand-green-deep">Fulfilment Details</h2>
            <div className="mt-4 rounded-xl bg-brand-cream/50 p-4 text-sm">
              <p className="font-semibold capitalize text-brand-green-deep">{order.fulfilment_method}</p>
              {isDelivery ? (
                <div className="mt-2 space-y-1 text-muted">
                  <p>{order.delivery_address || "No address supplied"}</p>
                  <p>Area: {order.delivery_area || "Not provided"}</p>
                  {order.delivery_directions ? <p>Directions: {order.delivery_directions}</p> : null}
                </div>
              ) : (
                <p className="mt-2 text-muted">Customer will collect from the kitchen. Confirm pickup details directly.</p>
              )}
            </div>
            {order.notes ? (
              <div className="mt-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Additional instructions</p>
                <p className="mt-1 text-sm text-foreground">{order.notes}</p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-brand-green-deep">Payment Information</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold text-foreground">{formatGhs(order.subtotal_pesewas)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">Delivery fee</dt>
                <dd className="text-right font-semibold text-foreground">
                  {!isDelivery || order.delivery_fee_status === "not_required" ? "Not applicable" : feePending ? <Badge variant="warning">Pending</Badge> : formatGhs(order.delivery_fee_pesewas)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3">
                <dt className="font-bold text-brand-green-deep">{feePending ? "Current total" : "Final amount"}</dt>
                <dd className="font-display text-xl font-extrabold text-brand-green-deep">{formatGhs(order.total_pesewas)}</dd>
              </div>
            </dl>
          </section>

          {isDelivery ? (
            <section className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-brand-green-deep">Delivery Fee Management</h2>
                {feePending ? <Badge variant="warning">Pending</Badge> : <Badge variant="success">Confirmed</Badge>}
              </div>
              <form action={updateDeliveryFeeAction} className="mt-4 space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="block">
                  <span className="text-sm font-medium text-brand-green-deep">Fee (GHS)</span>
                  <input
                    type="number"
                    name="deliveryFee"
                    min="0"
                    step="0.01"
                    defaultValue={order.delivery_fee_status === "confirmed" ? (order.delivery_fee_pesewas / 100).toFixed(2) : ""}
                    placeholder="0.00"
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10"
                  />
                </label>
                <button type="submit" className={buttonStyles({ variant: "accent", size: "sm", className: "w-full" })}>
                  Save delivery fee
                </button>
              </form>
              {!feePending ? (
                <ConfirmForm action={resetDeliveryFeeAction} message="Reset this delivery fee to pending?" className="mt-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <button type="submit" className="w-full rounded-xl px-4 py-2 text-xs font-medium text-muted hover:bg-brand-cream hover:text-brand-green-deep">Reset to pending</button>
                </ConfirmForm>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-brand-green-deep">Order Status</h2>
            <form action={updateOrderStatusAction} className="mt-4 space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="block">
                <span className="sr-only">Order status</span>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10"
                >
                  <option value="new">New</option>
                  <option value="preparing">Preparing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <button type="submit" className={buttonStyles({ size: "sm", className: "w-full" })}>
                Update status
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function formatOptions(value: Json): string {
  if (!Array.isArray(value)) return "Standard preparation";
  const names = value
    .map((option) => {
      if (typeof option !== "object" || option === null || Array.isArray(option)) return null;
      const record = option as Record<string, unknown>;
      return typeof record.optionName === "string" ? record.optionName : null;
    })
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : "Standard preparation";
}

function buildCustomerMessage(order: { customer_name: string; reference: string; fulfilment_method: string; subtotal_pesewas: number; delivery_fee_status: string; delivery_fee_pesewas: number; total_pesewas: number }): string {
  const firstName = order.customer_name.split(" ")[0] || "there";
  const feePending = order.fulfilment_method === "delivery" && order.delivery_fee_status === "pending";
  if (feePending) return `Hello ${firstName}, thank you for ordering from Eden Bites. Your order ${order.reference} has been received. We will confirm the delivery fee and final amount shortly.`;
  if (order.fulfilment_method === "pickup") return `Hello ${firstName}, your Eden Bites order ${order.reference} is confirmed. Total: ${formatGhs(order.total_pesewas)}. Pay on pickup.`;
  return `Hello ${firstName}, your Eden Bites order ${order.reference} is confirmed. Subtotal: ${formatGhs(order.subtotal_pesewas)}. Delivery fee: ${formatGhs(order.delivery_fee_pesewas)}. Final amount: ${formatGhs(order.total_pesewas)}. Pay on delivery.`;
}
