"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCartItemCount,
  getCartItemUnitPrice,
  getCartLineTotal,
  getCartSubtotal,
} from "@/lib/cart/cart";
import { removeFromCart, updateCartQuantity, useCart } from "@/lib/cart/store";
import { formatGhs } from "@/lib/format";
import type { StoreAvailability } from "@/lib/store/availability";

export function CartView({ store }: { store: StoreAvailability }) {
  const cart = useCart();

  if (!cart.ready) return <CartSkeleton />;

  if (cart.items.length === 0) {
    return (
      <EmptyState
        eyebrow="Your cart"
        title="Your cart is empty"
        description="Add a meal from the menu and it will appear here, ready for checkout."
        icon={<ShoppingBag className="size-6" />}
        action={
          <Link href="/menu" className={buttonStyles({ variant: "accent" })}>
            Browse the menu
          </Link>
        }
      />
    );
  }

  const itemCount = getCartItemCount(cart.items);
  const subtotal = getCartSubtotal(cart.items);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)] lg:items-start">
      <div className="space-y-4">
        {cart.items.map((item) => (
          <article
            key={item.key}
            className="flex gap-4 rounded-[1.25rem] border border-border/80 bg-white p-4 sm:gap-5 sm:p-5"
          >
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-brand-sand sm:size-32">
              <Image
                src={item.imageUrl}
                alt={item.imageAlt}
                fill
                sizes="(min-width: 640px) 8rem, 6rem"
                className="object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-brand-green-deep sm:text-xl">
                    {item.productName}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {item.options.length > 0
                      ? item.options.map((o) => o.optionName).join(", ")
                      : "Standard preparation"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-brand-green/60">
                    {formatGhs(getCartItemUnitPrice(item))} each
                  </p>
                </div>
                <p className="shrink-0 font-display text-lg font-extrabold text-brand-green-deep">
                  {formatGhs(getCartLineTotal(item))}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                <div className="inline-flex items-center rounded-xl border border-border bg-white p-1">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.key, item.quantity - 1)}
                    aria-label={`Decrease ${item.productName} quantity`}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-brand-green-deep transition-colors hover:bg-brand-cream"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-bold text-brand-green-deep" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.key, item.quantity + 1)}
                    aria-label={`Increase ${item.productName} quantity`}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-brand-green-deep transition-colors hover:bg-brand-cream"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.key)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-red-700"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
        <Link href="/menu" className="inline-flex text-sm font-semibold text-brand-green-deep underline decoration-brand-green/20 underline-offset-4 hover:decoration-brand-lime">
          Add more meals
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-[1.25rem] border border-border/80 bg-white p-6 sm:p-7">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-brand-green-deep">
            Order summary
          </h2>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </dt>
              <dd className="font-semibold text-brand-green-deep">
                {formatGhs(subtotal)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Delivery fee</dt>
              <dd className="max-w-[11rem] text-right text-xs font-medium text-brand-green/70">
                Confirmed after your location is reviewed
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <dt className="font-bold text-brand-green-deep">Total</dt>
              <dd className="font-display text-2xl font-extrabold text-brand-green-deep">
                {formatGhs(subtotal)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-5 text-muted">
            If you choose delivery, the final amount will include the confirmed
            delivery fee. Payment is made on delivery or pickup.
          </p>

          {!store.isOpen ? (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              {store.message || "Orders are currently paused."}
            </p>
          ) : null}

          {store.isOpen ? (
            <Link
              href="/checkout"
              className={buttonStyles({ variant: "accent", size: "lg", className: "mt-6 w-full" })}
            >
              Proceed to Checkout
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={buttonStyles({ variant: "outline", size: "lg", className: "mt-6 w-full cursor-not-allowed opacity-60" })}
            >
              Checkout unavailable
            </span>
          )}
        </div>
      </aside>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex animate-pulse gap-4 rounded-[1.25rem] border border-border/80 bg-white p-5">
            <div className="size-28 shrink-0 rounded-xl bg-brand-sand" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-5 w-2/3 rounded-full bg-brand-sand" />
              <div className="h-3 w-1/2 rounded-full bg-brand-sand" />
              <div className="h-9 w-28 rounded-xl bg-brand-sand" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[1.25rem] border border-border/80 bg-white" />
    </div>
  );
}
