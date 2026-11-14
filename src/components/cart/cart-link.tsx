"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { getCartItemCount } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

export function CartLink({ className }: { className?: string }) {
  const cart = useCart();
  const count = getCartItemCount(cart.items);
  const label = count > 0 ? `Cart, ${count} items` : "Cart, empty";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-xl text-brand-green-deep transition-colors hover:bg-brand-cream",
        className,
      )}
    >
      <ShoppingBag className="size-[1.2rem]" strokeWidth={1.8} aria-hidden="true" />
      {cart.ready && count > 0 ? (
        <span className="absolute right-0.5 top-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-brand-lime px-1 py-0.5 text-[0.6rem] font-bold leading-none text-brand-black ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
