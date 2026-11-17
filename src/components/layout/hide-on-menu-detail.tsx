"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function HideOnMenuDetail({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/menu/")) return null;
  return <>{children}</>;
}
