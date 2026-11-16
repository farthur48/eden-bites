import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, Clock3, MapPin, ReceiptText } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonStyles } from "@/components/ui/button";
import { getPublicBusinessProfile } from "@/lib/data/settings";
import { formatDateTime, formatGhs, formatOrderStatus, formatPaymentMethod, formatPaymentStatus } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders/types";
import { getOrderConfirmation } from "@/lib/orders/service";
import { smsHref } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const [order, profile] = await Promise.all([
    getOrderConfirmation(decodeURIComponent(reference)),
    getPublicBusinessProfile(),
  ]);

  if (!order) notFound();

  const isDelivery = order.fulfilmentMethod === "delivery";
  const deliveryFeePending = isDelivery && order.deliveryFeeStatus === "pending";
  const smsMessage =
    `Hello Eden Bites, I would like to confirm my order ${order.reference}.`;

  return (
    <section className="bg-background py-8 pb-28 sm:py-16 sm:pb-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-brand-lime text-brand-green-deep sm:size-16">
              <CheckCircle2 className="size-7 sm:size-8" strokeWidth={2.2} />
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep sm:text-4xl">
              Order received
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
              We&apos;ll contact you on <strong className="font-semibold text-brand-green-deep">{order.phone}</strong>. Payment is due on {isDelivery ? "delivery" : "pickup"}.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-white p-4 text-left">
              <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-green/55"><Clock3 className="size-3.5" /> What next</p>
              <p className="mt-2 text-sm font-medium text-brand-green-deep">We review & confirm your order shortly.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4 text-left">
              <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-green/55"><MapPin className="size-3.5" /> {isDelivery ? "Delivery" : "Pickup"}</p>
              <p className="mt-2 text-sm font-medium text-brand-green-deep">{isDelivery ? "Fee (if any) confirmed before dispatch." : "We’ll share pickup details when ready."}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4 text-left">
              <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-green/55"><ReceiptText className="size-3.5" /> Keep this</p>
              <p className="mt-2 text-sm font-medium text-brand-green-deep">Save your order number for reference.</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-border/80 bg-white">
            <div className="border-b border-border/70 bg-brand-cream/40 px-5 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-brand-green/55">Order number</p>
                  <p className="mt-1 select-all font-display text-2xl font-extrabold tracking-tight text-brand-green-deep">{order.orderNumber || order.reference}</p>
                  {order.orderNumber ? <p className="mt-0.5 text-xs text-muted">Ref: <span className="select-all">{order.reference}</span></p> : null}
                  <p className="mt-1 text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <span className="inline-flex rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-brand-black">
                  {formatOrderStatus(order.status)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/70 p-4 text-sm">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-green/45">{deliveryFeePending ? "Current amount" : "Amount"}</p>
                  <p className="mt-1 font-display text-xl font-extrabold text-brand-green-deep">{formatGhs(order.totalPesewas)}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-green/45">Fulfilment</p>
                  <p className="mt-1 font-semibold capitalize text-brand-green-deep">{order.fulfilmentMethod}</p>
                </div>
              </div>
              {deliveryFeePending ? <p className="mt-3 text-xs font-medium text-amber-800">Delivery fee will be confirmed and shared with you shortly.</p> : null}
            </div>

            <div className="space-y-3 px-5 py-5 sm:px-8 sm:py-6">
              <OrderProgress status={order.status} fulfilment={order.fulfilmentMethod} />
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Customer</dt>
                  <dd className="mt-1 text-sm font-semibold text-brand-green-deep">{order.customerName}</dd>
                  <dd className="text-sm text-muted">{order.phone}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Fulfilment</dt>
                  <dd className="mt-1 text-sm font-semibold capitalize text-brand-green-deep">{order.fulfilmentMethod}</dd>
                  {isDelivery ? (
                    <dd className="mt-0.5 text-sm text-muted">
                      {[order.address, order.area].filter(Boolean).join(", ") || "Address provided"}
                    </dd>
                  ) : (
                    <dd className="mt-0.5 text-sm text-muted">
                      {profile.pickupInstructions || "Pickup details will be confirmed with you."}
                    </dd>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Payment</dt>
                  <dd className="mt-1 text-sm font-semibold text-brand-green-deep">
                    {formatPaymentMethod(order.paymentMethod)} · {formatPaymentStatus(order.paymentStatus)}
                  </dd>
                  <dd className="mt-0.5 text-xs text-muted">No online payment taken. Payment status is confirmed by the kitchen.</dd>
                </div>
              </dl>

              <div className="mt-7">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Meals ordered</p>
                <ul className="mt-3 divide-y divide-border/70 rounded-xl border border-border/70">
                  {order.items.map((item, index) => (
                    <li key={`${item.productName}-${index}`} className="flex items-start justify-between gap-4 px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-brand-green-deep">
                          {item.quantity} × {item.productName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.options.length > 0 ? item.options.map((o) => o.optionName).join(", ") : "Standard preparation"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-brand-green-deep">
                        {formatGhs(item.lineTotalPesewas)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 rounded-xl bg-brand-cream/60 p-5">
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="font-semibold text-brand-green-deep">{formatGhs(order.subtotalPesewas)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted">Delivery fee</dt>
                    <dd className="text-right font-semibold text-brand-green-deep">
                      {!isDelivery ? "Not applicable" : deliveryFeePending ? "Pending confirmation" : formatGhs(order.deliveryFeePesewas ?? 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-brand-green/10 pt-3">
                    <dt className="font-bold text-brand-green-deep">
                      {deliveryFeePending ? "Current amount" : "Amount"}
                    </dt>
                    <dd className="font-display text-xl font-extrabold text-brand-green-deep">{formatGhs(order.totalPesewas)}</dd>
                  </div>
                </dl>
                {deliveryFeePending ? (
                  <p className="mt-3 text-xs leading-relaxed text-amber-800">
                    The delivery fee will be confirmed after your location is reviewed and the final amount will be shared with you.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 hidden flex-col items-center justify-center gap-3 sm:flex sm:flex-row">
            {(profile.smsNumber || profile.whatsappNumber) ? (
              <a href={smsHref((profile.smsNumber || profile.whatsappNumber)!, smsMessage)} className={buttonStyles({ variant: "accent", size: "lg", className: "w-full sm:w-auto" })}>
                <MessageCircle className="size-4" /> Contact by SMS
              </a>
            ) : null}
            <Link href="/" className={buttonStyles({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>Return Home</Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted">Keep order <span className="font-semibold text-brand-green-deep">{order.orderNumber || order.reference}</span> private.</p>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white/95 p-3 backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-3xl gap-2">
              {(profile.smsNumber || profile.whatsappNumber) ? (
                <a href={smsHref((profile.smsNumber || profile.whatsappNumber)!, smsMessage)} className={buttonStyles({ variant: "accent", size: "md", className: "flex-1" })}>
                  <MessageCircle className="size-4" /> Contact
                </a>
              ) : null}
              <Link href="/" className={buttonStyles({ variant: "outline", size: "md", className: "flex-1" })}>Home</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function OrderProgress({ status, fulfilment }: { status: OrderStatus; fulfilment: "delivery" | "pickup" }) {
  const steps =
    fulfilment === "pickup"
      ? ([
          { key: "new", label: "Placed" },
          { key: "preparing", label: "Preparing" },
          { key: "completed", label: "Ready / Picked up" },
        ] as const)
      : ([
          { key: "new", label: "Placed" },
          { key: "preparing", label: "Preparing" },
          { key: "out_for_delivery", label: "Out for delivery" },
          { key: "completed", label: "Delivered" },
        ] as const);
  const order = ["new", "preparing", "out_for_delivery", "completed"] as const;
  const cancelled = status === "cancelled";
  const currentIdx = Math.max(0, order.indexOf(status as (typeof order)[number]));
  const isDone = (key: string) => {
    const stepIdx = order.indexOf(key as (typeof order)[number]);
    if (fulfilment === "pickup" && key === "completed") return status === "completed";
    return stepIdx <= currentIdx;
  };
  return (
    <div className="rounded-xl border border-border/70 bg-brand-cream/30 p-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Order progress</p>
      {cancelled ? (
        <p className="mt-2 text-sm font-semibold text-red-700">This order was cancelled. Contact us if you need help.</p>
      ) : (
        <>
          <ol className="mt-3 hidden grid-cols-4 gap-2 sm:grid">
            {steps.map((step) => {
              const done = isDone(step.key);
              return (
                <li key={step.key} className="min-w-0">
                  <div className={`h-1.5 rounded-full ${done ? "bg-brand-green-deep" : "bg-border"}`} />
                  <p className={`mt-2 text-[0.68rem] font-semibold leading-tight ${done ? "text-brand-green-deep" : "text-muted"}`}>{step.label}</p>
                </li>
              );
            })}
          </ol>
          <ol className="mt-3 space-y-2 sm:hidden">
            {steps.map((step) => {
              const done = isDone(step.key);
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span className={`inline-flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold ${done ? "bg-brand-green-deep text-white" : "bg-border text-muted"}`}>{done ? "✓" : ""}</span>
                  <span className={`text-sm font-medium ${done ? "text-brand-green-deep" : "text-muted"}`}>{step.label}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
