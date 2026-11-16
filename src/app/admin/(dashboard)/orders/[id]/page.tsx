import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { getOrderDetail } from "@/lib/data/orders";
import { getBusinessSettings } from "@/lib/data/settings";
import { formatDateTime, formatGhs, formatOrderStatus, formatPaymentMethod, formatPaymentStatus } from "@/lib/format";
import { phoneHref, smsHref } from "@/lib/site-config";
import type { Json, OrderStatus } from "@/types/database";

import {
  resetDeliveryFeeAction,
  updateDeliveryFeeAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
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
    case "out_for_delivery":
      return "lime";
    default:
      return "default";
  }
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; fee?: string; payment?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [detail, settings] = await Promise.all([getOrderDetail(id), getBusinessSettings()]);

  if (!detail) notFound();

  const { order, items } = detail;
  const notifySms = settings?.notify_whatsapp ?? false;
  const isDelivery = order.fulfilment_method === "delivery";
  const feePending = isDelivery && order.delivery_fee_status === "pending";
  const customerMessage = buildCustomerMessage(order);
  const nextStatuses = getNextStatuses(order.status, isDelivery, feePending);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand-green-deep">
            <ArrowLeft className="size-4" /> Back to orders
          </Link>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep">
            {order.order_number || order.reference}
          </h1>
          {order.order_number && order.order_number !== order.reference ? <p className="mt-1 text-xs text-muted">Ref: {order.reference}</p> : null}
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
          <Badge variant="outline"><span className="capitalize">{order.fulfilment_method}</span></Badge>
        </div>
      </div>

      {query.updated ? (
        <p className={query.updated === "error" || query.updated === "invalid" || query.updated === "needs_fee" ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"}>
          {query.updated === "error"
            ? "The order status could not be updated."
            : query.updated === "invalid"
              ? "That status change is not allowed."
              : query.updated === "needs_fee"
                ? "Confirm the delivery fee before marking this delivery order as completed."
                : `Order marked as ${formatOrderStatus(query.updated)}.`}
        </p>
      ) : null}
      {query.fee ? (
        <p className={query.fee === "saved" || query.fee === "reset" ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"}>
          {query.fee === "saved" ? "Delivery fee saved." : query.fee === "reset" ? "Delivery fee reset to pending." : "Could not update delivery fee."}
        </p>
      ) : null}
      {query.payment ? (
        <p className={query.payment === "saved" ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"}>
          {query.payment === "saved" ? "Payment status updated." : "Could not update payment status."}
        </p>
      ) : null}

      {nextStatuses.length > 0 ? (
        <section className="sticky top-16 z-10 -mx-1 rounded-[1.25rem] border border-border/70 bg-white/95 p-4 shadow-sm backdrop-blur sm:static sm:mx-0 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-green/55">Quick status update</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {nextStatuses.map((status) => (
              <form key={status} action={updateOrderStatusAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  disabled={status === "completed" && feePending}
                  className={buttonStyles({
                    variant: status === "cancelled" ? "outline" : status === "completed" ? "accent" : "primary",
                    size: "sm",
                    className: "w-full sm:w-auto",
                  })}
                >
                  {status === "out_for_delivery" ? "Out for delivery" : status === "completed" ? "Completed" : formatOrderStatus(status)}
                </button>
              </form>
            ))}
          </div>
          {feePending ? <p className="mt-2 text-xs text-amber-800">Confirm delivery fee before marking completed.</p> : null}
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <details open className="group rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <summary className="cursor-pointer list-none font-display text-xl font-bold text-brand-green-deep">Customer Information</summary>
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
              {notifySms ? (
                <a href={smsHref(order.customer_phone, customerMessage)} className={buttonStyles({ variant: "accent", size: "sm" })}>
                  <MessageCircle className="size-4" /> SMS
                </a>
              ) : null}
            </div>
          </details>

          <details open className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
            <summary className="cursor-pointer list-none border-b border-border/70 px-5 py-4 font-display text-xl font-bold text-brand-green-deep sm:px-6">
              Meal Information
            </summary>
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
          </details>

          <details className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <summary className="cursor-pointer list-none font-display text-xl font-bold text-brand-green-deep">Fulfilment Details</summary>
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
          </details>
        </div>

        <div className="space-y-4">
          <details open className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <summary className="cursor-pointer list-none font-display text-xl font-bold text-brand-green-deep">Payment Information</summary>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Payment method</dt>
                <dd className="font-semibold text-foreground">{formatPaymentMethod(order.payment_method ?? (order.fulfilment_method === "pickup" ? "cash_on_pickup" : "cash_on_delivery"))}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Payment status</dt>
                <dd className="font-semibold text-foreground">{formatPaymentStatus(order.payment_status ?? "pending")}</dd>
              </div>
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
            <form action={updatePaymentStatusAction} className="mt-5 border-t border-border/70 pt-4">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="block">
                <span className="text-sm font-medium text-brand-green-deep">Update payment status</span>
                <select
                  name="paymentStatus"
                  defaultValue={order.payment_status ?? "pending"}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <button type="submit" className={buttonStyles({ variant: "outline", size: "sm", className: "mt-3 w-full" })}>
                Save payment status
              </button>
            </form>
          </details>

          {isDelivery ? (
            <details open className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-xl font-bold text-brand-green-deep">
                <span>Delivery Fee</span>
                {feePending ? <Badge variant="warning">Pending</Badge> : <Badge variant="success">Confirmed</Badge>}
              </summary>
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
            </details>
          ) : null}

          <details className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
            <summary className="cursor-pointer list-none font-display text-xl font-bold text-brand-green-deep">All status options</summary>
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
                  <option value="out_for_delivery">Out for delivery</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <button type="submit" className={buttonStyles({ size: "sm", className: "w-full" })}>
                Update status
              </button>
            </form>
          </details>
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

function getNextStatuses(status: OrderStatus, isDelivery: boolean, feePending: boolean): OrderStatus[] {
  const map: Record<OrderStatus, OrderStatus[]> = {
    new: ["preparing", "out_for_delivery", "completed", "cancelled"],
    preparing: ["out_for_delivery", "completed", "cancelled"],
    out_for_delivery: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  return map[status].filter((s) => !(s === "completed" && isDelivery && feePending));
}

function buildCustomerMessage(order: { customer_name: string; reference: string; fulfilment_method: string; subtotal_pesewas: number; delivery_fee_status: string; delivery_fee_pesewas: number; total_pesewas: number }): string {
  const firstName = order.customer_name.split(" ")[0] || "there";
  const feePending = order.fulfilment_method === "delivery" && order.delivery_fee_status === "pending";
  if (feePending) return `Hello ${firstName}, thank you for ordering from Eden Bites. Your order ${order.reference} has been received. We will confirm the delivery fee and final amount shortly.`;
  if (order.fulfilment_method === "pickup") return `Hello ${firstName}, your Eden Bites order ${order.reference} is confirmed. Total: ${formatGhs(order.total_pesewas)}. Pay on pickup.`;
  return `Hello ${firstName}, your Eden Bites order ${order.reference} is confirmed. Subtotal: ${formatGhs(order.subtotal_pesewas)}. Delivery fee: ${formatGhs(order.delivery_fee_pesewas)}. Final amount: ${formatGhs(order.total_pesewas)}. Pay on delivery.`;
}
