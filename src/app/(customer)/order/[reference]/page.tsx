import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonStyles } from "@/components/ui/button";
import { getPublicBusinessProfile } from "@/lib/data/settings";
import { formatDateTime, formatGhs } from "@/lib/format";
import { getOrderConfirmation } from "@/lib/orders/service";
import { whatsappHref } from "@/lib/site-config";

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
  const whatsappMessage = encodeURIComponent(
    `Hello Eden Bites, I would like to confirm my order ${order.reference}.`,
  );

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-brand-lime text-brand-green-deep">
              <CheckCircle2 className="size-8" strokeWidth={2.2} />
            </span>
            <h1 className="mt-6 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep sm:text-4xl lg:text-5xl">
              Your Order Has Been Received!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
              Thank you{order.customerName ? `, ${order.customerName.split(" ")[0]}` : ""}. We&apos;ve received your order and will contact you on{" "}
              <strong className="font-semibold text-brand-green-deep">{order.phone}</strong> to confirm the details and final amount.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-border/80 bg-white">
            <div className="border-b border-border/70 bg-brand-cream/40 px-6 py-5 sm:px-8">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-brand-green/55">
                Order reference
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-brand-green-deep">
                {order.reference}
              </p>
              <p className="mt-1 text-xs text-muted">{formatDateTime(order.createdAt)}</p>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <dl className="grid gap-5 sm:grid-cols-2">
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

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {profile.whatsappNumber ? (
              <a
                href={`${whatsappHref(profile.whatsappNumber)}?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ variant: "accent", size: "lg", className: "w-full sm:w-auto" })}
              >
                <MessageCircle className="size-4" />
                Contact on WhatsApp
              </a>
            ) : null}
            <Link href="/" className={buttonStyles({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
              Return Home
            </Link>
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            Keep your order reference <span className="font-semibold text-brand-green-deep">{order.reference}</span> for any follow-up.
          </p>
        </div>
      </Container>
    </section>
  );
}
