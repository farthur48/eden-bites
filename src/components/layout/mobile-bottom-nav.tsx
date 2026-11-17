"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ClipboardList, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/menu", label: "Menu", icon: LayoutGrid, match: (p: string) => p.startsWith("/menu") },
  { href: "/orders", label: "Orders", icon: ClipboardList, match: (p: string) => p.startsWith("/orders") || p.startsWith("/order/") || p === "/cart" || p === "/order-confirmation" },
  { href: "/account", label: "Account", icon: UserRound, match: (p: string) => p.startsWith("/account") },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-4 px-1">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5"
            >
              <Icon
                className={cn(active ? "text-[#14532D]" : "text-gray-800")}
                strokeWidth={active ? 2.4 : 1.8}
                size={22}
                aria-hidden="true"
              />
              <span className={cn("text-[0.68rem] leading-none", active ? "font-bold text-[#14532D]" : "font-medium text-gray-800")}>
                {item.label}
              </span>
              {active ? <span className="mt-1 h-1 w-12 rounded-full bg-[#A3E635]" aria-hidden="true" /> : <span className="mt-1 h-1 w-12" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
