import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  icon,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-brand border border-dashed border-brand-green/20 bg-card px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-brand-lime/30 text-brand-green">
          {icon}
        </span>
      ) : null}
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green/60">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="font-display text-2xl font-semibold text-brand-green">
        {title}
      </h3>
      {description ? (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
