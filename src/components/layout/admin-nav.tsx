"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, LogOut, Settings, UtensilsCrossed } from "lucide-react";

import { signOutAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/menu", label: "Menu Management", shortLabel: "Menu", icon: UtensilsCrossed },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminNav({
  newOrderCount,
  mobile = false,
}: {
  newOrderCount: number;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (mobile) {
    return (
      <nav aria-label="Admin" className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const active = isActive(item.href, "exact" in item ? item.exact : false);
          const Icon = item.icon;
          const showBadge = item.href === "/admin/orders" && newOrderCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-green-deep text-white" : "bg-brand-cream text-brand-green-deep/75",
              )}
            >
              <Icon className="size-4" strokeWidth={1.8} />
              {"shortLabel" in item ? item.shortLabel : item.label}
              {showBadge ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-lime px-1.5 py-0.5 text-[0.6rem] font-bold text-brand-black">
                  {newOrderCount > 99 ? "99+" : newOrderCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="space-y-1">
        {items.map((item) => {
          const active = isActive(item.href, "exact" in item ? item.exact : false);
          const Icon = item.icon;
          const showBadge = item.href === "/admin/orders" && newOrderCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-white/12 text-white"
                  : "text-brand-cream/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("size-[1.1rem]", active ? "text-brand-lime" : "text-brand-cream/60")} strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              {showBadge ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand-lime px-1.5 py-0.5 text-[0.62rem] font-bold text-brand-black">
                  {newOrderCount > 99 ? "99+" : newOrderCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-brand-cream/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-[1.1rem] text-brand-cream/60" strokeWidth={1.8} />
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
