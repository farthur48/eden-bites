import { notFound } from "next/navigation";

import { MenuItemDetail } from "@/components/menu/menu-item-detail";
import { getMenuProducts } from "@/lib/menu/catalog";
import { getStoreAvailability } from "@/lib/store/availability";
import type { MenuProduct } from "@/lib/menu/types";

export const dynamic = "force-dynamic";

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
  { name: "Jollof Rice Combo", pricePesewas: 6000, rating: { rating: 4.8, count: "1.2k" } },
  { name: "Fried Rice", pricePesewas: 5500, rating: { rating: 4.7, count: "980" } },
  { name: "Grilled Chicken Wings", pricePesewas: 7000, rating: { rating: 4.9, count: "740" } },
  { name: "Banku & Tilapia", pricePesewas: 6500, rating: { rating: 4.8, count: "620" } },
  { name: "Fried Plantain", pricePesewas: 2000, rating: { rating: 4.7, count: "530" } },
  { name: "Plain Rice with Stew", pricePesewas: 5000, rating: { rating: 4.8, count: "410" } },
] as const;

function countToNumber(count: string): number {
  return count.endsWith("k") ? Math.round(parseFloat(count) * 1000) : parseInt(count, 10);
}

function withDisplayRating(p: MenuProduct) {
  const key = p.name.toLowerCase().trim();
  const info =
    RATING_OVERRIDES[key] ||
    RATING_OVERRIDES[key.replace(/&/g, "and")] ||
    RATING_OVERRIDES[key.replace(/ and /g, " & ")] ||
    DEFAULT_RATING;
  return { ...p, rating: info.rating, ratingCount: countToNumber(info.count) };
}

function findProduct(products: MenuProduct[], id: string) {
  const decoded = decodeURIComponent(id).toLowerCase();
  const direct = products.find((p) => p.slug.toLowerCase() === decoded || p.id.toLowerCase() === decoded);
  if (direct) return withDisplayRating(direct);
  const normalized = decoded.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const spec = SPEC_ITEMS.find((s) => {
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return slug === decoded || `spec-${slug}` === decoded || s.name.toLowerCase() === normalized;
  });
  if (spec) {
    const match = products.find((p) => p.name.toLowerCase().trim() === spec.name.toLowerCase());
    const fallbackImage = products[0]?.imageUrl || "/menu/banku-tilapia.jpg";
    if (match) {
      return {
        ...match,
        pricePesewas: spec.pricePesewas,
        rating: spec.rating.rating,
        ratingCount: countToNumber(spec.rating.count),
      };
    }
    return {
      id: `spec-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      slug: spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: spec.name,
      tagline: "",
      description: "Delicious meal prepared fresh for you, made with quality ingredients and served hot.",
      pricePesewas: spec.pricePesewas,
      imageUrl: fallbackImage,
      imageAlt: spec.name,
      isFeatured: false,
      isAvailable: true,
      prepMinutes: 0,
      serves: "",
      tags: [],
      allergenNote: "",
      optionGroups: [],
      rating: spec.rating.rating,
      ratingCount: countToNumber(spec.rating.count),
    } as MenuProduct & { rating: number; ratingCount: number };
  }
  return null;
}

export default async function MenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [menu, store] = await Promise.all([getMenuProducts(), getStoreAvailability()]);
  const product = findProduct(menu.products, id);
  if (!product) notFound();
  return <MenuItemDetail product={product} isStoreOpen={store.isOpen} />;
}
