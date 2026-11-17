"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bike,
  Check,
  ChevronLeft,
  CreditCard,
  Crosshair,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import {
  getCartLineTotal,
  getCartSubtotal,
  type CartItem,
} from "@/lib/cart/cart";
import { clearCart, useCart } from "@/lib/cart/store";
import { formatGhs } from "@/lib/format";
import type { CheckoutState, FulfilmentMethod } from "@/lib/orders/types";
import type { StoreAvailability } from "@/lib/store/availability";
import { cn } from "@/lib/utils";

import { placeOrderAction } from "./actions";

const initialState: CheckoutState = { status: "idle" };
const DRAFT_KEY = "eden-bites-checkout-draft:v1";
const DELIVERY_FEE = 1500;

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

function getSizeLabel(item: CartItem): string {
  const size = item.options.find((o) => /size/i.test(o.groupName) || /regular|large|extra/i.test(o.optionName));
  if (!size) return "Regular";
  return size.optionName.replace(/\s*size\s*/i, "").trim() || size.optionName;
}

function getExtrasLabel(item: CartItem): string | null {
  const extras = item.options.filter((o) => !(/size/i.test(o.groupName) || /regular|large|extra/i.test(o.optionName)));
  if (extras.length === 0) return null;
  return extras.map((o) => o.optionName).join(", ");
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
    router.replace("/order-confirmation");
  }, [router, state]);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Taking you to your confirmation...</h2>
        <p className="mt-2 text-sm text-gray-600">Order {state.confirmation.orderNumber || state.confirmation.reference}</p>
      </div>
    );
  }

  if (!cart.ready) {
    return <div className="min-h-[40vh]" aria-busy="true" />;
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        eyebrow="Checkout"
        title="Your cart is empty"
        description="Add a meal from the menu before checking out."
        action={<Link href="/menu" className="inline-flex rounded-2xl bg-[#14532D] px-5 py-3 text-sm font-bold text-white">Browse the menu</Link>}
      />
    );
  }

  const subtotal = getCartSubtotal(cart.items);
  const deliveryFee = fulfilment === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const cartPayload = JSON.stringify(
    cart.items.map((item) => ({
      productId: item.productId,
      optionIds: item.options.map((option) => option.optionId),
      quantity: item.quantity,
    })),
  );
  const paymentValue = fulfilment === "delivery" ? "cash_on_delivery" : "cash_on_pickup";

  return (
    <div className="pb-4">
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F6EE] text-gray-900"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Checkout</h1>
          <p className="text-xs text-gray-600">Complete your order securely</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-[#F9FBEF] p-4">
        <div className="flex items-center">
          <div className="flex flex-1 flex-col items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#14532D] text-white">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <span className="mt-1 text-xs font-semibold text-[#14532D]">Cart</span>
          </div>
          <div className="mb-5 h-0.5 flex-1 bg-[#14532D]" />
          <div className="flex flex-1 flex-col items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#14532D] text-sm font-bold text-white">2</span>
            <span className="mt-1 text-xs font-bold text-[#14532D]">Checkout</span>
          </div>
          <div className="mb-5 h-0.5 flex-1 bg-gray-300" />
          <div className="flex flex-1 flex-col items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-500">3</span>
            <span className="mt-1 text-xs font-semibold text-gray-500">Confirmation</span>
          </div>
        </div>
      </div>

      <form
        action={formAction}
        className="space-y-1"
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
        <input type="hidden" name="paymentMethod" value={paymentValue} readOnly />

        {!store.isOpen ? (
          <p role="alert" className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {store.message || "Orders are currently paused."}
          </p>
        ) : null}

        {state.status === "error" ? (
          <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-semibold">{state.message}</p>
            {fieldErrors && Object.keys(fieldErrors).length > 0 ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {Object.entries(fieldErrors).map(([k, v]) => (v ? <li key={k}>{v}</li> : null))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <section>
          <h2 className="mb-3 mt-4 flex items-center gap-2 text-base font-bold text-gray-900">
            <User className="size-4 text-[#14532D]" aria-hidden="true" /> Contact Information
          </h2>
          <div className="space-y-3">
            <label className="block">
              <span className="sr-only">Full name</span>
              <div className={cn("flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-sm", fieldErrors?.name ? "border-red-400" : "border-gray-200")}>
                <User className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
                <input name="name" autoComplete="name" placeholder="Full name" required className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" />
              </div>
              {fieldErrors?.name ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.name}</span> : null}
            </label>
            <label className="block">
              <span className="sr-only">Email address</span>
              <div className={cn("flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-sm", fieldErrors?.email ? "border-red-400" : "border-gray-200")}>
                <Mail className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
                <input type="email" name="email" autoComplete="email" placeholder="Email address" className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" />
              </div>
              {fieldErrors?.email ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.email}</span> : null}
            </label>
            <label className="block">
              <span className="sr-only">Phone number</span>
              <div className={cn("flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-sm", fieldErrors?.phone ? "border-red-400" : "border-gray-200")}>
                <Phone className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
                <input type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder="Phone number" required className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" />
              </div>
              {fieldErrors?.phone ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.phone}</span> : null}
            </label>
          </div>
        </section>

        <fieldset className="mt-4 grid grid-cols-2 gap-3">
          <legend className="sr-only">Fulfillment method</legend>
          <label className={cn("flex cursor-pointer items-center justify-between rounded-2xl p-3", fulfilment === "delivery" ? "border-2 border-[#14532D] bg-[#F4F6EE]" : "border border-gray-200 bg-white")}>
            <input type="radio" name="fulfilment" value="delivery" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} className="sr-only" />
            <span className="flex items-center gap-2.5">
              <Bike className="size-5 text-[#14532D]" aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold text-gray-900">Delivery</span>
                <span className="block text-[11px] text-gray-600">To your location</span>
              </span>
            </span>
            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", fulfilment === "delivery" ? "border-[#14532D]" : "border-gray-300")}>
              {fulfilment === "delivery" ? <span className="h-2.5 w-2.5 rounded-full bg-[#14532D]" /> : null}
            </span>
          </label>
          <label className={cn("flex cursor-pointer items-center justify-between rounded-2xl p-3", fulfilment === "pickup" ? "border-2 border-[#14532D] bg-[#F4F6EE]" : "border border-gray-200 bg-white")}>
            <input type="radio" name="fulfilment" value="pickup" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")} className="sr-only" />
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="size-5 text-[#14532D]" aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold text-gray-900">Pickup</span>
                <span className="block text-[11px] text-gray-600">Collect order</span>
              </span>
            </span>
            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", fulfilment === "pickup" ? "border-[#14532D]" : "border-gray-300")}>
              {fulfilment === "pickup" ? <span className="h-2.5 w-2.5 rounded-full bg-[#14532D]" /> : null}
            </span>
          </label>
        </fieldset>

        {fulfilment === "delivery" ? (
          <section>
            <h2 className="mb-2 mt-4 flex items-center gap-2 text-base font-bold text-gray-900">
              <MapPin className="size-4 text-[#14532D]" aria-hidden="true" /> Delivery Address
            </h2>
            <label className="block">
              <span className="sr-only">Delivery address</span>
              <div className={cn("flex items-center justify-between rounded-2xl border bg-white px-4 py-3.5 text-sm", fieldErrors?.address ? "border-red-400" : "border-gray-200")}>
                <input name="address" autoComplete="street-address" placeholder="Enter your delivery address..." required={fulfilment === "delivery"} className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" />
                <button type="button" aria-label="Use current location" className="ml-2 text-[#14532D]">
                  <Crosshair className="size-5" />
                </button>
              </div>
              {fieldErrors?.address ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.address}</span> : null}
            </label>
            <label className="mt-2 block">
              <span className="sr-only">Area / neighbourhood</span>
              <div className={cn("flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-sm", fieldErrors?.area ? "border-red-400" : "border-gray-200")}>
                <input name="area" placeholder="Area / neighbourhood" required={fulfilment === "delivery"} className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" />
              </div>
              {fieldErrors?.area ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.area}</span> : null}
            </label>
          </section>
        ) : (
          <section className="mt-4 rounded-2xl border border-gray-200 bg-[#F9FBEF] p-4 text-sm text-gray-800">
            <h2 className="mb-1 font-bold text-gray-900">Pickup Information</h2>
            <p>{pickupInstructions || "Pickup details will be confirmed after you place your order."}</p>
          </section>
        )}

        <div className="mb-2 mt-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Order Summary</h2>
          <Link href="/cart" className="text-sm font-semibold text-[#14532D]">Edit Cart →</Link>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            {cart.items.map((item) => {
              const size = getSizeLabel(item);
              const extras = getExtrasLabel(item);
              return (
                <div key={item.key} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-brand-sand">
                    <Image src={item.imageUrl} alt={item.imageAlt} fill sizes="4rem" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{item.productName}</p>
                      <p className="mt-0.5 text-xs text-gray-600">{size}{extras ? `, ${extras}` : ""}</p>
                      <p className="mt-0.5 text-xs font-semibold text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-gray-900">{formatGhs(getCartLineTotal(item))}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatGhs(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-gray-700">Delivery Fee <Info className="size-3.5 text-gray-500" aria-hidden="true" /></span>
              <span className="font-semibold text-gray-900">{fulfilment === "delivery" ? formatGhs(DELIVERY_FEE) : "—"}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-lg font-extrabold">
            <span className="text-gray-900">Total</span>
            <span className="text-[#15803D]">{formatGhs(total)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F4F6EE] px-4 py-3 text-xs font-semibold text-[#14532D]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            <span><span className="font-bold">Secure &amp; Reliable</span> <span className="font-medium text-[#14532D]/80">/ Your information is safe with us.</span></span>
          </div>
          <Lock className="size-4 shrink-0" aria-hidden="true" />
        </div>

        <button
          type="submit"
          disabled={!store.isOpen || isPending}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#14532D] py-4 text-base font-bold text-white shadow-md hover:bg-[#113E24] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard className="size-5" aria-hidden="true" /> {isPending ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}

function createIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
