"use client";

import { useState } from "react";
import { Bike, ChevronDown, Store } from "lucide-react";

import { cn } from "@/lib/utils";

const KEY = "eden-bites-fulfilment:v1";
type Mode = "delivery" | "pickup";

function read(): Mode {
  if (typeof window === "undefined") return "delivery";
  try {
    const v = localStorage.getItem(KEY);
    return v === "pickup" ? "pickup" : "delivery";
  } catch {
    return "delivery";
  }
}

export function FulfilmentSelector({
  address,
  compact = false,
}: {
  address?: string | null;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(() => read());
  const [open, setOpen] = useState(false);

  function choose(next: Mode) {
    setMode(next);
    setOpen(false);
    try {
      localStorage.setItem(KEY, next);
      const raw = sessionStorage.getItem("eden-bites-checkout-draft:v1");
      const draft = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      sessionStorage.setItem(
        "eden-bites-checkout-draft:v1",
        JSON.stringify({ ...draft, fulfilment: next }),
      );
    } catch {}
  }

  const label = mode === "delivery" ? "Delivery" : "Pickup";
  const detail =
    mode === "delivery"
      ? address?.trim() || "Set at checkout"
      : "Collect in store";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex max-w-[11rem] items-center gap-1.5 rounded-xl border border-border/70 bg-white text-left transition-colors hover:bg-brand-cream/50 sm:max-w-[14rem]",
          compact ? "px-2.5 py-1.5" : "px-3 py-2",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Fulfilment: ${label}. ${detail}`}
      >
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-lime/40 text-brand-green-deep">
          {mode === "delivery" ? <Bike className="size-4" /> : <Store className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-green/55">
            {label}
          </span>
          <span className="block truncate text-xs font-semibold text-brand-green-deep">{detail}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-border bg-white p-1.5 shadow-lg" role="listbox">
            {([
              { value: "delivery" as const, title: "Delivery", desc: "Delivered to you", icon: Bike },
              { value: "pickup" as const, title: "Pickup", desc: "Collect from kitchen", icon: Store },
            ]).map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    active ? "bg-brand-lime/20" : "hover:bg-brand-cream/60",
                  )}
                >
                  <Icon className="size-4 text-brand-green-deep" />
                  <span>
                    <span className="block text-sm font-semibold text-brand-green-deep">{opt.title}</span>
                    <span className="block text-xs text-muted">{opt.desc}</span>
                  </span>
                </button>
              );
            })}
            <p className="px-3 pb-1 pt-2 text-[0.65rem] text-muted">You can confirm details at checkout.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
