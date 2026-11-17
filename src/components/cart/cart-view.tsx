"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headset,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";

import {
  getCartLineTotal,
  getCartSubtotal,
  type CartItem,
} from "@/lib/cart/cart";
import { clearCart, removeFromCart, updateCartQuantity, useCart } from "@/lib/cart/store";
import { formatGhs } from "@/lib/format";
import type { StoreAvailability } from "@/lib/store/availability";

const DELIVERY_FEE = 1500;

function getSizeLabel(item: CartItem): string {
  const size = item.options.find((o) => /size/i.test(o.groupName) || /regular|large|extra/i.test(o.optionName));
  if (!size) return "Regular Size";
  return /size/i.test(size.optionName) ? size.optionName : `${size.optionName} Size`;
}

function getExtrasLabel(item: CartItem): string | null {
  const extras = item.options.filter((o) => !(/size/i.test(o.groupName) || /regular|large|extra/i.test(o.optionName)));
  if (extras.length === 0) return null;
  return `+ ${extras.map((o) => o.optionName).join(", ")}`;
}

function getCustomizationSummary(item: CartItem): string {
  const parts = item.options.map((o) => o.optionName);
  return parts.length ? `(${parts.join(" + ")})` : "";
}

export function CartView({ store }: { store: StoreAvailability }) {
  const cart = useCart();
  const router = useRouter();

  if (!cart.ready) {
    return <div className="min-h-[40vh]" aria-busy="true" />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="pb-24">
        <div className="mt-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F6EE]"
              aria-label="Back"
            >
              <ChevronLeft className="size-5 text-gray-900" />
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900">Your Cart</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="font-display text-lg font-bold text-brand-green-deep">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted">Add a meal from the menu to get started.</p>
          <Link href="/menu" className="mt-4 inline-flex rounded-2xl bg-[#1E4620] px-5 py-3 text-sm font-bold text-white">
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getCartSubtotal(cart.items);
  const total = subtotal + DELIVERY_FEE;

  return (
    <div className="pb-4">
      <div className="mt-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F6EE]"
            aria-label="Back"
          >
            <ChevronLeft className="size-5 text-gray-900" />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Your Cart</h1>
        </div>
        <button
          type="button"
          onClick={() => clearCart()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D]"
        >
          <Trash2 className="size-3.5" aria-hidden="true" /> Clear Cart
        </button>
      </div>

      <div className="space-y-3.5">
        {cart.items.map((item) => {
          const extras = getExtrasLabel(item);
          return (
            <article
              key={item.key}
              className="relative flex gap-3.5 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-brand-sand md:h-24 md:w-24">
                <Image src={item.imageUrl} alt={item.imageAlt} fill sizes="(min-width: 768px) 6rem, 5rem" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 pr-8 text-base font-bold text-gray-900">{item.productName}</h2>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.key)}
                    aria-label={`Remove ${item.productName}`}
                    className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="min-w-0">
                  <span className="mt-1 inline-block w-fit rounded-full bg-[#EBF5D6] px-2.5 py-0.5 text-xs font-bold text-[#14532D]">
                    {getSizeLabel(item)}
                  </span>
                  {extras ? <p className="mt-1 text-xs text-gray-600">{extras}</p> : null}
                </div>
                <div className="mt-2 flex w-full items-center justify-between gap-2">
                  <p className="text-lg font-extrabold text-[#15803D]">{formatGhs(getCartLineTotal(item))}</p>
                  <div className="flex shrink-0 items-center gap-3.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-bold">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.key, item.quantity - 1)}
                      aria-label={`Decrease ${item.productName} quantity`}
                      className="text-gray-900"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-3 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.key, item.quantity + 1)}
                      aria-label={`Increase ${item.productName} quantity`}
                      className="text-gray-900"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F4F6EE] p-3.5">
        <div className="flex items-center gap-3">
          <Tag className="size-5 text-[#14532D]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-gray-900">Have a promo code?</p>
            <p className="text-xs text-gray-600">Enter code to get a discount</p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-full border border-[#14532D] px-5 py-2 text-xs font-bold text-[#14532D] transition hover:bg-[#14532D] hover:text-white"
        >
          Apply
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-extrabold text-gray-900">Order Summary</h2>
        <div className="space-y-2 border-b border-gray-100 pb-3 text-sm">
          {cart.items.map((item) => {
            const summary = getCustomizationSummary(item);
            return (
              <div key={item.key} className="flex items-start justify-between gap-3">
                <p className="text-gray-900">
                  {item.productName} {summary ? <span className="text-gray-500">{summary}</span> : null}
                </p>
                <p className="shrink-0 font-bold text-gray-900">{formatGhs(getCartLineTotal(item))}</p>
              </div>
            );
          })}
        </div>
        <div className="space-y-2 border-b border-gray-100 py-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900">Subtotal</p>
            <p className="font-bold text-gray-900">{formatGhs(subtotal)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1 text-gray-900">
              Delivery Fee <Info className="size-3.5 text-gray-500" aria-hidden="true" />
            </p>
            <p className="text-gray-500">{formatGhs(DELIVERY_FEE)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3">
          <p className="text-lg font-extrabold text-gray-900">Total</p>
          <p className="text-xl font-extrabold text-[#15803D]">{formatGhs(total)}</p>
        </div>
      </div>

      {store.isOpen ? (
        <Link
          href="/checkout"
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1E4620] py-4 text-base font-bold text-white shadow-md hover:bg-[#143D1D]"
        >
          <CreditCard className="size-5" aria-hidden="true" /> Proceed to Checkout <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gray-300 py-4 text-base font-bold text-white">
          Orders paused
        </span>
      )}

      <div className="mt-3 mb-24 grid grid-cols-3 divide-x divide-gray-300 rounded-2xl bg-[#F4F6EE] px-2 py-3 text-[11px] font-semibold text-gray-800">
        <div className="flex items-center justify-center gap-1.5 px-1 text-center">
          <ShieldCheck className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" /> <span>Secure &amp; Reliable</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 px-1 text-center">
          <Truck className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" /> <span>Fast Delivery</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 px-1 text-center">
          <Headset className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" /> <span>24/7 Support</span>
        </div>
      </div>
    </div>
  );
}
