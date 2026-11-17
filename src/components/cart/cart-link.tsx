"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { getCartItemCount } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

export function CartLink({ className }: { className?: string }) {
  const cart = useCart();
  const pathname = usePathname();
  const count = getCartItemCount(cart.items);
  const forceZero = pathname === "/order-confirmation" || pathname.startsWith("/order/");
  const displayCount = forceZero ? 0 : count;
  const showBadge = forceZero ? true : cart.ready && count > 0;
  const label = displayCount > 0 ? `Cart, ${displayCount} items` : forceZero ? "Cart, 0 items" : "Cart, empty";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-xl text-[#111111] transition-colors hover:bg-gray-100",
        className,
      )}
    >
      <ShoppingCart className="size-[1.35rem]" strokeWidth={1.9} aria-hidden="true" />
      {showBadge ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] h-[1.1rem] items-center justify-center rounded-full bg-[#A3E635] px-1 text-[0.6rem] font-bold leading-none text-black ring-2 ring-white">
          {displayCount > 99 ? "99+" : displayCount}
        </span>
      ) : null}
    </Link>
  );
}
