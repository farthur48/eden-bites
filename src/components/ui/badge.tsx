import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variants = {
  default: "bg-brand-green/8 text-brand-green",
  lime: "bg-brand-lime text-brand-black",
  outline: "border border-brand-green/20 text-brand-green",
  muted: "bg-brand-sand text-muted",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
} as const;

export type BadgeVariant = keyof typeof variants;

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-tight",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
