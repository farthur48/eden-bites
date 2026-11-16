"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, Store } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCartItemCount, getCartSubtotal } from "@/lib/cart/cart";
import { clearCart, useCart } from "@/lib/cart/store";
import { formatGhs } from "@/lib/format";
import type { CheckoutState, FulfilmentMethod } from "@/lib/orders/types";
import type { StoreAvailability } from "@/lib/store/availability";
import { cn } from "@/lib/utils";

import { placeOrderAction } from "./actions";

const initialState: CheckoutState = { status: "idle" };
const DRAFT_KEY = "eden-bites-checkout-draft:v1";

type Draft = { fulfilment?: FulfilmentMethod; values?: Record<string, string> };

function readDraft(): Draft {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

export function CheckoutForm({
  store,
  pickupInstructions,
}: {
  store: StoreAvailability;
  pickupInstructions: string | null;
}) {
  const cart = useCart();
  const router = useRouter();
  const [draft] = useState(readDraft);
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>(
    draft.fulfilment === "pickup" || draft.fulfilment === "delivery" ? draft.fulfilment : "delivery",
  );
  const [idempotencyKey] = useState(() => createIdempotencyKey());
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialState);

  useEffect(() => {
    const values = draft.values ?? {};
    for (const [name, value] of Object.entries(values)) {
      try {
        const el = document.querySelector(`[name="${CSS.escape(name)}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el && !el.value) el.value = value;
      } catch {}
    }
  }, [draft.values]);

  useEffect(() => {
    if (state.status !== "success") return;
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    clearCart();
    router.replace(`/order/${encodeURIComponent(state.confirmation.reference)}`);
  }, [router, state]);

  if (state.status === "success") {
    return (
      <div className="rounded-[1.25rem] border border-border bg-white p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-brand-green-deep">
          Taking you to your confirmation...
        </h2>
        <p className="mt-2 text-sm text-muted">Order {state.confirmation.orderNumber || state.confirmation.reference}</p>
      </div>
    );
  }

  if (!cart.ready) return <CheckoutSkeleton />;

  if (cart.items.length === 0) {
    return (
      <EmptyState
        eyebrow="Checkout"
        title="Your cart is empty"
        description="Add a meal from the menu before checking out."
        action={<Link href="/menu" className={buttonStyles({ variant: "accent" })}>Browse the menu</Link>}
      />
    );
  }

  const subtotal = getCartSubtotal(cart.items);
  const itemCount = getCartItemCount(cart.items);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const cartPayload = JSON.stringify(
    cart.items.map((item) => ({
      productId: item.productId,
      optionIds: item.options.map((option) => option.optionId),
      quantity: item.quantity,
    })),
  );
  const paymentOptions =
    fulfilment === "delivery"
      ? [
          { value: "cash_on_delivery", label: "Cash on delivery" },
          { value: "momo_on_delivery", label: "MoMo on delivery" },
        ]
      : [
          { value: "cash_on_pickup", label: "Cash on pickup" },
          { value: "momo_on_pickup", label: "MoMo on pickup" },
        ];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.75fr)] lg:items-start">
      <form
        action={formAction}
        className="space-y-5"
        onChange={(e) => {
          const form = e.currentTarget;
          try {
            const fd = new FormData(form);
            const values: Record<string, string> = {};
            for (const key of ["name", "phone", "email", "address", "area", "directions", "notes"]) {
              const v = fd.get(key);
              if (typeof v === "string" && v) values[key] = v;
            }
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fulfilment, values }));
          } catch {}
        }}
      >
        <input type="hidden" name="cart" value={cartPayload} readOnly />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} readOnly />

        <div className="rounded-[1.25rem] border border-border/80 bg-white p-4 sm:p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/50">Checkout steps</p>
          <ol className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold">
            <li className="rounded-xl bg-brand-green-deep px-3 py-2 text-center text-white">1. Details</li>
            <li className={`rounded-xl px-3 py-2 text-center ${fulfilment === "delivery" ? "bg-brand-lime/40 text-brand-green-deep" : "bg-brand-cream text-brand-green-deep"}`}>2. {fulfilment === "delivery" ? "Delivery" : "Pickup"}</li>
            <li className="rounded-xl bg-brand-cream px-3 py-2 text-center text-brand-green-deep">3. Payment</li>
          </ol>
          <p className="mt-2 text-[0.7rem] text-muted">No online payment. We’ll confirm and you pay on {fulfilment}.</p>
        </div>

        {!store.isOpen ? (
          <p role="alert" className="rounded-xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
            {store.message || "Orders are currently paused."}
          </p>
        ) : null}

        {state.status === "error" ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
            <p className="font-semibold">{state.message}</p>
            {fieldErrors && Object.keys(fieldErrors).length > 0 ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
                {Object.entries(fieldErrors).map(([k, v]) => (v ? <li key={k}>{v}</li> : null))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <section className="rounded-[1.25rem] border border-border/80 bg-white p-5 sm:p-7">
          <h2 className="font-display text-xl font-bold text-brand-green-deep">Customer Information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" autoComplete="name" placeholder="Ama Mensah" error={fieldErrors?.name} required />
            <Field label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 000 0000" error={fieldErrors?.phone} required />
            <Field label="Email address (optional)" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={fieldErrors?.email} className="sm:col-span-2" />
          </div>
        </section>

        <fieldset className="rounded-[1.25rem] border border-border/80 bg-white p-5 sm:p-7">
          <legend className="font-display text-xl font-bold text-brand-green-deep">Fulfilment Method</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([
              { value: "delivery", title: "Delivery", description: "Have your meal delivered to you", icon: Bike },
              { value: "pickup", title: "Pickup", description: "Collect your order from the kitchen", icon: Store },
            ] as const).map((option) => {
              const checked = fulfilment === option.value;
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-4 transition-all",
                    checked ? "border-brand-green bg-brand-lime/10 ring-1 ring-brand-green/20" : "border-border bg-white hover:border-brand-green/30",
                  )}
                >
                  <input
                    type="radio"
                    name="fulfilment"
                    value={option.value}
                    checked={checked}
                    onChange={() => setFulfilment(option.value)}
                    className="mt-1 size-4 shrink-0 accent-[#174b20]"
                  />
                  <span className="flex gap-3">
                    <span className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl", checked ? "bg-brand-green text-brand-lime" : "bg-brand-cream text-brand-green/70")}>
                      <Icon className="size-5" strokeWidth={1.8} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-brand-green-deep">{option.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">{option.description}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {fulfilment === "delivery" ? (
          <section className="rounded-[1.25rem] border border-border/80 bg-white p-5 sm:p-7">
            <h2 className="font-display text-xl font-bold text-brand-green-deep">Delivery Details</h2>
            <div className="mt-5 grid gap-4">
              <Field label="Delivery address" name="address" autoComplete="street-address" placeholder="House number, street, landmark" error={fieldErrors?.address} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Area / neighbourhood" name="area" placeholder="East Legon, Madina..." error={fieldErrors?.area} required />
                <Field label="Additional directions (optional)" name="directions" placeholder="Gate colour, landmark..." />
              </div>
              <p className="rounded-xl bg-brand-cream px-4 py-3 text-xs leading-relaxed text-brand-green/75">
                Delivery fee will be confirmed after reviewing your location and included in the final amount.
              </p>
            </div>
          </section>
        ) : (
          <section className="rounded-[1.25rem] border border-border/80 bg-white p-5 sm:p-7">
            <h2 className="font-display text-xl font-bold text-brand-green-deep">Pickup Information</h2>
            <div className="mt-4 rounded-xl bg-brand-lime/10 px-4 py-4 text-sm leading-relaxed text-brand-green-deep">
              {pickupInstructions || "Pickup details will be confirmed after you place your order. We will contact you with the location and time."}
            </div>
          </section>
        )}

        <fieldset className="rounded-[1.25rem] border border-border/80 bg-white p-5 sm:p-7">
          <legend className="font-display text-xl font-bold text-brand-green-deep">Payment Arrangement</legend>
            <p className="mt-2 text-sm text-muted">No online payment now. Choose how you will pay on {fulfilment}. We may confirm details by SMS/call.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {paymentOptions.map((option, index) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 hover:border-brand-green/30">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  defaultChecked={index === 0}
                  className="size-4 accent-[#174b20]"
                />
                <span className="text-sm font-medium text-brand-green-deep">{option.label}</span>
              </label>
            ))}
          </div>
          {fieldErrors?.payment ? <p className="mt-2 text-xs text-red-700">{fieldErrors.payment}</p> : null}
        </fieldset>

        <section className="rounded-[1.25rem] border border-border/80 bg-white p-5 sm:p-7">
          <h2 className="font-display text-xl font-bold text-brand-green-deep">Additional Instructions</h2>
          <div className="mt-4">
            <Field label="Order notes (optional)" name="notes" placeholder="Allergies, preferences, extra requests..." textarea />
          </div>
        </section>

        <button
          type="submit"
          disabled={!store.isOpen || isPending}
          className={buttonStyles({ variant: "accent", size: "lg", className: "w-full" })}
        >
          {isPending ? "Placing your order..." : "Place Order"}
        </button>
        <p className="text-center text-xs text-muted">No online payment required. Pay on delivery or pickup.</p>
      </form>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-[1.25rem] border border-border/80 bg-white p-6 sm:p-7">
          <h2 className="font-display text-xl font-bold text-brand-green-deep">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {cart.items.map((item) => (
              <li key={item.key} className="flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-green-deep">
                    {item.quantity} × {item.productName}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                    {item.options.length > 0 ? item.options.map((o) => o.optionName).join(", ") : "Standard preparation"}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-brand-green-deep">{formatGhs(getCartSubtotal([item]))}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Items ({itemCount})</dt>
              <dd className="font-semibold text-brand-green-deep">{formatGhs(subtotal)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Delivery fee</dt>
              <dd className="max-w-[10rem] text-right text-xs font-medium text-brand-green/70">
                {fulfilment === "delivery" ? "To be confirmed" : "Not applicable"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
              <dt className="font-bold text-brand-green-deep">
                {fulfilment === "delivery" ? "Estimated total" : "Total"}
              </dt>
              <dd className="font-display text-xl font-extrabold text-brand-green-deep">{formatGhs(subtotal)}</dd>
            </div>
          </dl>
          <Link href="/cart" className="mt-5 block text-center text-xs font-semibold text-brand-green/60 hover:text-brand-green-deep">
            Edit cart
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  error,
  required = false,
  className,
  textarea = false,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "text" | "email";
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  textarea?: boolean;
}) {
  const errorId = `${name}-error`;
  const shared = cn(
    "mt-2 w-full rounded-xl border bg-white px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10",
    textarea ? "min-h-28 py-3" : "h-12",
    error ? "border-red-400" : "border-border",
  );

  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-medium text-brand-green-deep">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className={shared} />
      ) : (
        <input type={type} name={name} autoComplete={autoComplete} inputMode={inputMode} placeholder={placeholder} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className={shared} />
      )}
      {error ? <span id={errorId} className="mt-1.5 block text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.75fr)]">
      <div className="space-y-5">
        <div className="h-56 animate-pulse rounded-[1.25rem] border border-border/80 bg-white" />
        <div className="h-72 animate-pulse rounded-[1.25rem] border border-border/80 bg-white" />
      </div>
      <div className="h-80 animate-pulse rounded-[1.25rem] border border-border/80 bg-white" />
    </div>
  );
}

function createIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
