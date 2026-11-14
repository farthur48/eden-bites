import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand-green text-brand-white hover:bg-brand-green-soft focus-visible:outline-brand-green",
  accent:
    "bg-brand-lime text-brand-black hover:bg-brand-lime-deep focus-visible:outline-brand-green",
  outline:
    "border border-brand-green/20 bg-white text-brand-green hover:border-brand-green/40 hover:bg-brand-cream/70 focus-visible:outline-brand-green",
  ghost:
    "bg-transparent text-brand-green hover:bg-brand-green/5 focus-visible:outline-brand-green",
  danger:
    "bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700",
  dark:
    "bg-brand-green-deep text-white hover:bg-brand-green focus-visible:outline-brand-green",
} as const;

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
