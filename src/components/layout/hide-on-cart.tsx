"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function HideOnCart({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  if (
    pathname === "/cart" ||
    pathname.startsWith("/order/") ||
    pathname === "/order-confirmation" ||
    pathname === "/orders" ||
    pathname === "/account"
  )
    return null;
  return <div className={cn(className)}>{children}</div>;
}
