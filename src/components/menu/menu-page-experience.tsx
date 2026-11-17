"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { ProductCard } from "@/components/menu/product-card";
import type { MenuProduct } from "@/lib/menu/types";
import type { StoreAvailability } from "@/lib/store/availability";
import { cn } from "@/lib/utils";

const categoryTabs = [
  { key: "rice", label: "Rice", image: "/categories/rice.jpg" },
  { key: "local-meals", label: "Local Meals", image: "/categories/local-meals.jpg" },
  { key: "chicken", label: "Chicken", image: "/categories/chicken.jpg" },
  { key: "sides", label: "Sides", image: "/categories/sides.jpg" },
] as const;

function matchesCategory(product: MenuProduct, category: string): boolean {
  const c = category.trim().toLowerCase();
  if (!c) return true;
  const hay = [product.name, product.tagline, product.description, ...(product.tags ?? [])].join(" ").toLowerCase();
  if (c === "rice") return hay.includes("rice") || hay.includes("jollof") || hay.includes("waakye") || hay.includes("fried rice");
  if (c === "local-meals" || c === "local meals" || c === "local") return hay.includes("banku") || hay.includes("fufu") || hay.includes("waakye") || hay.includes("kenkey") || hay.includes("tilapia") || hay.includes("acheke") || hay.includes("atti") || hay.includes("local");
  if (c === "chicken") return hay.includes("chicken") || hay.includes("wing");
  if (c === "sides") return hay.includes("side") || hay.includes("plantain") || hay.includes("fries") || hay.includes("salad") || hay.includes("sauce") || hay.includes("extra") || hay.includes("stew");
  return hay.includes(c);
}

type RatingInfo = { rating: number; count: string };
const RATING_OVERRIDES: Record<string, RatingInfo> = {
  "jollof rice combo": { rating: 4.8, count: "1.2k" },
  "fried rice": { rating: 4.7, count: "980" },
  "grilled chicken wings": { rating: 4.9, count: "740" },
  "banku & tilapia": { rating: 4.8, count: "620" },
  "banku and tilapia": { rating: 4.8, count: "620" },
  "acheke & tilapia": { rating: 4.7, count: "560" },
  "acheke and tilapia": { rating: 4.7, count: "560" },
  "fried plantain": { rating: 4.7, count: "530" },
  "plain rice with stew": { rating: 4.8, count: "410" },
};
const DEFAULT_RATING: RatingInfo = { rating: 4.8, count: "500" };
const SPEC_ITEMS = [
  { name: "Jollof Rice Combo", pricePesewas: 6000, rating: { rating: 4.8, count: "1.2k" }, category: "rice" },
  { name: "Fried Rice", pricePesewas: 5500, rating: { rating: 4.7, count: "980" }, category: "rice" },
  { name: "Grilled Chicken Wings", pricePesewas: 7000, rating: { rating: 4.9, count: "740" }, category: "chicken" },
  { name: "Banku & Tilapia", pricePesewas: 6500, rating: { rating: 4.8, count: "620" }, category: "local-meals" },
  { name: "Fried Plantain", pricePesewas: 2000, rating: { rating: 4.7, count: "530" }, category: "sides" },
  { name: "Plain Rice with Stew", pricePesewas: 5000, rating: { rating: 4.8, count: "410" }, category: "rice" },
] as const;

function countToNumber(count: string): number {
  return count.endsWith("k") ? Math.round(parseFloat(count) * 1000) : parseInt(count, 10);
}

function getDisplayRatingInfo(p: MenuProduct): RatingInfo {
  const key = p.name.toLowerCase().trim();
  return (
    RATING_OVERRIDES[key] ||
    RATING_OVERRIDES[key.replace(/&/g, "and")] ||
    RATING_OVERRIDES[key.replace(/ and /g, " & ")] ||
    DEFAULT_RATING
  );
}

function withDisplayRating(p: MenuProduct): MenuProduct & { rating?: number; ratingCount?: number } {
  const info = getDisplayRatingInfo(p);
  return { ...p, rating: info.rating, ratingCount: countToNumber(info.count) } as MenuProduct & { rating?: number; ratingCount?: number };
}

function resolveSpecProducts(products: MenuProduct[]): MenuProduct[] {
  const fallbackImage = products[0]?.imageUrl || "/menu/banku-tilapia.jpg";
  return SPEC_ITEMS.map((spec) => {
    const match = products.find((p) => p.name.toLowerCase().trim() === spec.name.toLowerCase());
    if (match) {
      return { ...match, pricePesewas: spec.pricePesewas, rating: spec.rating.rating, ratingCount: countToNumber(spec.rating.count) } as MenuProduct & { rating?: number; ratingCount?: number };
    }
    return {
      id: `spec-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      slug: spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: spec.name,
      tagline: "",
      description: "Delicious meal prepared fresh for you.",
      pricePesewas: spec.pricePesewas,
      imageUrl: fallbackImage,
      imageAlt: spec.name,
      isFeatured: spec.category === "rice",
      isAvailable: true,
      prepMinutes: 0,
      serves: "",
      tags: [],
      allergenNote: "",
      optionGroups: [],
      rating: spec.rating.rating,
      ratingCount: countToNumber(spec.rating.count),
    } as MenuProduct & { rating?: number; ratingCount?: number };
  }) as unknown as MenuProduct[];
}

export function MenuPageExperience({
  products,
  store,
  initialQuery = "",
  initialCategory = "",
}: {
  products: MenuProduct[];
  store: StoreAvailability;
  initialQuery?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory || "");
  const [pill, setPill] = useState<"all" | "popular" | "top-rated" | "fastest">("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const filterKey = `${query.trim().toLowerCase()}|${category}|${pill}`;
  const showAll = expandedKey === filterKey;

  useEffect(() => {
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    const t = window.setTimeout(() => {
      router.replace(url, { scroll: false });
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, category, pathname, router]);

  const hasFastestData = useMemo(() => products.some((p) => (p.prepMinutes ?? 0) > 0), [products]);

  const { displayProducts, totalCount, noExactMatch } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isDefaultView = !q && !category && pill === "all";
    let base: MenuProduct[];
    let noExactMatch = false;
    if (isDefaultView) {
      base = resolveSpecProducts(products);
    } else {
      base = products.filter((p) => (category ? matchesCategory(p, category) : true));
      if (q) {
        const specAsProducts = resolveSpecProducts(products) as MenuProduct[];
        const merged = [...base];
        for (const sp of specAsProducts) {
          if (!merged.some((p) => p.name.toLowerCase().trim() === sp.name.toLowerCase().trim())) merged.push(sp);
        }
        const matched = merged.filter((p) => [p.name, p.description, p.tagline, ...(p.tags ?? [])].join(" ").toLowerCase().includes(q));
        if (matched.length === 0) {
          noExactMatch = true;
          base = merged.length > 0 ? merged : [...products];
        } else {
          base = matched;
        }
      } else if (base.length === 0 && category) {
        base = [...products];
      }
      if (pill === "popular") base = [...base].sort((a, b) => (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1));
      if (pill === "top-rated") base = [...base].sort((a, b) => getDisplayRatingInfo(b).rating - getDisplayRatingInfo(a).rating);
      if (pill === "fastest") base = [...base].sort((a, b) => (a.prepMinutes || 999) - (b.prepMinutes || 999));
      if (!showAll) base = base.slice(0, 6);
    }
    return { displayProducts: base.map(withDisplayRating), totalCount: base.length, noExactMatch };
  }, [products, query, category, pill, showAll]);

  const qTrim = query.trim();
  const isDefaultView = !qTrim && !category && pill === "all";
  const activeLabel = pill === "all" ? "All" : pill === "popular" ? "Popular" : pill === "top-rated" ? "Top Rated" : "Fastest";
  const showClear = qTrim || category || pill !== "all" || noExactMatch;
  const canShowMore = !isDefaultView && !showAll && totalCount >= 6;

  return (
    <div className="pb-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-500 transition-colors" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for meals..."
          autoComplete="off"
          enterKeyHint="search"
          className="h-11 w-full rounded-full bg-gray-100 px-4 pl-11 pr-10 text-sm text-foreground placeholder:text-gray-500 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50"
          aria-label="Search for meals"
        />
        {qTrim ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 min-h-[1.25rem]" aria-live="polite">
        <p className="text-xs font-medium text-[#14532D]/80">
          {noExactMatch ? "No exact matches — showing recommended meals" : qTrim ? `${displayProducts.length} result${displayProducts.length === 1 ? "" : "s"}` : ""}
        </p>
        {showClear ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setCategory(""); setPill("all"); }}
            className="text-xs font-semibold text-[#14532D] underline decoration-[#14532D]/30 underline-offset-2"
          >
            Clear
          </button>
        ) : null}
      </div>
      {/* Category selector */}
      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {categoryTabs.map((tab) => {
          const active = category === tab.key;
          return (
            <div key={tab.key} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setCategory(tab.key)}
                className={cn(
                  "relative flex w-full flex-col items-center justify-center rounded-2xl border bg-[#F4F6EE] px-1.5 py-3 text-center shadow-sm transition-all",
                  active
                    ? "border-[1.5px] border-[#14532D] shadow-md"
                    : "border-[#14532D]/10 hover:border-[#14532D]/20 hover:shadow-md",
                )}
              >
                <span className={cn("relative flex size-10 items-center justify-center overflow-hidden rounded-full", active ? "ring-2 ring-[#A3E635]/60" : "bg-white")}>
                  <Image src={tab.image} alt={tab.label} fill sizes="40px" className="object-cover" />
                </span>
                <span className="mt-1.5 whitespace-nowrap text-[13px] font-semibold text-gray-900">{tab.label}</span>
              </button>
              {active ? <span className="mt-1.5 h-1 w-14 rounded-full bg-[#A3E635]" /> : <span className="mt-1.5 h-1 w-14" />}
            </div>
          );
        })}
      </div>

      {/* Filter & sort pills */}
      <div className="mt-4 flex items-center gap-2.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setPill("all")}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold",
            pill === "all" ? "bg-[#14532D] text-white" : "border border-gray-200 bg-white text-gray-900",
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setPill("popular")}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold",
            pill === "popular" ? "bg-[#14532D] text-white" : "border border-gray-200 bg-white text-gray-900",
          )}
        >
          Popular
        </button>
        <button
          type="button"
          onClick={() => setPill("top-rated")}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold",
            pill === "top-rated" ? "bg-[#14532D] text-white" : "border border-gray-200 bg-white text-gray-900",
          )}
        >
          Top Rated
        </button>
        <button
          type="button"
          onClick={() => setPill("fastest")}
          disabled={!hasFastestData}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40",
            pill === "fastest" ? "bg-[#14532D] text-white" : "border border-gray-200 bg-white text-gray-900",
          )}
        >
          Fastest
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Showing: <span className="font-semibold text-[#14532D]">{activeLabel}</span></p>

      {/* Grid */}
      {displayProducts.length > 0 ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {displayProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                isStoreOpen={store.isOpen}
                priority={index < 2}
                variant="grid"
              />
            ))}
          </div>
          {canShowMore ? (
            <button
              type="button"
              onClick={() => setExpandedKey(filterKey)}
              className="mt-4 w-full rounded-full border border-[#14532D]/20 bg-white py-2.5 text-sm font-semibold text-[#14532D] hover:bg-[#F4F6EE]"
            >
              Show more meals
            </button>
          ) : null}
        </>
      ) : null}

     


    </div>
  );
}
