"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { ProductCard } from "@/components/menu/product-card";
import { ProductCustomizer } from "@/components/menu/product-customizer";
import type { MenuProduct } from "@/lib/menu/types";
import type { StoreAvailability } from "@/lib/store/availability";
import { cn } from "@/lib/utils";

type Filter = "all" | "available" | "featured";

export function MenuExperience({
  products,
  store,
  ctaLabel,
  showControls = true,
}: {
  products: MenuProduct[];
  store: StoreAvailability;
  ctaLabel?: string;
  showControls?: boolean;
}) {
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);
  const [addedProductName, setAddedProductName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!addedProductName) return;
    const timer = window.setTimeout(() => setAddedProductName(null), 3500);
    return () => window.clearTimeout(timer);
  }, [addedProductName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "available" && !p.isAvailable) return false;
      if (filter === "featured" && !p.isFeatured) return false;
      if (!q) return true;
      const hay = [p.name, p.description, p.tagline, ...(p.tags ?? []), p.allergenNote]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [products, query, filter]);

  function handleAdded(productName: string) {
    setSelectedProduct(null);
    setAddedProductName(productName);
  }

  if (products.length === 0) return null;

  return (
    <>
      {showControls ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search menu</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meals, tags..."
              className="h-11 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {([
              ["all", "All"],
              ["available", "Available"],
              ["featured", "Popular"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  filter === key ? "bg-brand-green-deep text-white" : "border border-border/70 bg-white text-muted hover:text-brand-green-deep",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-border bg-white p-10 text-center">
          <p className="font-display text-lg font-bold text-brand-green-deep">No meals match</p>
          <p className="mt-1 text-sm text-muted">Try a different search or filter.</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className="mt-4 text-sm font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              isStoreOpen={store.isOpen}
              onSelect={setSelectedProduct}
              priority={index === 0 && !query && filter === "all"}
              ctaLabel={ctaLabel}
            />
          ))}
        </div>
      )}

      {selectedProduct ? (
        <ProductCustomizer
          key={selectedProduct.id}
          product={selectedProduct}
          isStoreOpen={store.isOpen}
          onClose={() => setSelectedProduct(null)}
          onAdded={handleAdded}
        />
      ) : null}

      {addedProductName ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[80] flex w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-brand-green/10 bg-white p-3.5 pl-4 shadow-2xl shadow-brand-green/20"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-green-deep">{addedProductName} added</p>
            <p className="text-xs text-muted">Ready in your cart</p>
          </div>
          <Link href="/checkout" className="shrink-0 rounded-xl bg-brand-lime px-3.5 py-2 text-xs font-bold text-brand-black">Checkout</Link>
          <Link href="/cart" className="shrink-0 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-brand-green-deep">Cart</Link>
        </div>
      ) : null}
    </>
  );
}
