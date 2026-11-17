"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { ProductCard } from "@/components/menu/product-card";
import type { MenuProduct } from "@/lib/menu/types";
import type { StoreAvailability } from "@/lib/store/availability";
import { cn } from "@/lib/utils";

type Filter = "all" | "available" | "featured";

function matchesCategory(product: MenuProduct, category: string): boolean {
  const c = category.trim().toLowerCase();
  if (!c) return true;
  const hay = [product.name, product.tagline, product.description, ...(product.tags ?? [])].join(" ").toLowerCase();
  if (c === "rice") return hay.includes("rice") || hay.includes("jollof") || hay.includes("waakye") || hay.includes("fried rice");
  if (c === "local" || c === "local meals" || c === "local-meals") return hay.includes("banku") || hay.includes("fufu") || hay.includes("waakye") || hay.includes("kenkey") || hay.includes("local") || hay.includes("tilapia") || hay.includes("acheke") || hay.includes("atti");
  if (c === "chicken") return hay.includes("chicken");
  if (c === "sides") return hay.includes("side") || hay.includes("plantain") || hay.includes("fries") || hay.includes("salad") || hay.includes("sauce") || hay.includes("extra");
  return hay.includes(c);
}

export function MenuExperience({
  products,
  store,
  ctaLabel,
  showControls = true,
  compactCards = false,
  cardVariant = "default",
  initialQuery = "",
  initialCategory = "",
}: {
  products: MenuProduct[];
  store: StoreAvailability;
  ctaLabel?: string;
  showControls?: boolean;
  compactCards?: boolean;
  cardVariant?: "default" | "grid";
  initialQuery?: string;
  initialCategory?: string;
  linkToDetail?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState(initialCategory);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "available" && !p.isAvailable) return false;
      if (filter === "featured" && !p.isFeatured) return false;
      if (category && !matchesCategory(p, category)) return false;
      if (!q) return true;
      const hay = [p.name, p.description, p.tagline, ...(p.tags ?? []), p.allergenNote]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [products, query, filter, category]);



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

      {category && showControls ? (
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-brand-lime/25 px-3 py-1 text-xs font-semibold text-brand-green-deep capitalize">{category.replace(/-/g, " ")}</span>
          <button type="button" onClick={() => setCategory("")} className="text-xs font-semibold text-brand-green-deep underline decoration-brand-green/20 underline-offset-4">Clear category</button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-border bg-white p-10 text-center">
          <p className="font-display text-lg font-bold text-brand-green-deep">No meals match</p>
          <p className="mt-1 text-sm text-muted">Try a different search or filter.</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("all"); setCategory(""); }} className="mt-4 text-sm font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div className={cn("grid grid-cols-2", cardVariant === "grid" ? "gap-3" : "gap-3 sm:gap-6")}>
          {filtered.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              isStoreOpen={store.isOpen}
              priority={index === 0 && !query && filter === "all"}
              ctaLabel={ctaLabel}
              compact={compactCards}
              variant={cardVariant}
            />
          ))}
        </div>
      )}
    </>
  );
}
