"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function HideOnAccount({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/account") return null;
  return <>{children}</>;
}

export function ShowOnAccount({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/account") return null;
  return <>{children}</>;
}
