"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Check, Minus, Plus, ShoppingCart, Star, UtensilsCrossed } from "lucide-react";

import { addToCart } from "@/lib/cart/store";
import { createCartItem, MAX_CART_QUANTITY } from "@/lib/cart/cart";
import { formatGhs } from "@/lib/format";
import type { MenuProduct, SelectedMenuOption } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

const SIZES = [
  { id: "regular", name: "Regular", add: 0 },
  { id: "large", name: "Large", add: 1500 },
  { id: "extra-large", name: "Extra Large", add: 3000 },
] as const;

const EXTRAS = [
  { id: "fried-plantain", name: "Fried Plantain", price: 1000, image: "/menu/banku-tilapia.jpg" },
  { id: "coleslaw", name: "Coleslaw", price: 500, image: "/menu/acheke-tilapia.jpg" },
  { id: "extra-chicken", name: "Extra Chicken", price: 2000, image: "/menu/banku-tilapia.jpg" },
] as const;

export function MenuItemDetail({
  product,
  isStoreOpen,
}: {
  product: MenuProduct & { rating?: number; ratingCount?: number };
  isStoreOpen: boolean;
}) {
  const [sizeId, setSizeId] = useState<(typeof SIZES)[number]["id"]>("regular");
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const base = product.pricePesewas;
  const sizeAdd = SIZES.find((s) => s.id === sizeId)?.add ?? 0;
  const extrasAdd = EXTRAS.filter((e) => extras.includes(e.id)).reduce((t, e) => t + e.price, 0);
  const unit = base + sizeAdd + extrasAdd;
  const total = unit * qty;
  const rating = product.rating ?? 4.8;
  const ratingCount = product.ratingCount ?? 1200;
  const ratingLabel =
    ratingCount >= 1000 ? `${(ratingCount / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${ratingCount}`;

  function toggleExtra(id: string) {
    setExtras((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function handleAdd() {
    if (!isStoreOpen || !product.isAvailable) return;
    const size = SIZES.find((s) => s.id === sizeId)!;
    const selected: SelectedMenuOption[] = [
      { groupId: "size", groupName: "Choose Size", optionId: size.id, optionName: size.name, pricePesewas: size.add },
      ...EXTRAS.filter((e) => extras.includes(e.id)).map((e) => ({
        groupId: "extras",
        groupName: "Add Extras",
        optionId: e.id,
        optionName: e.name,
        pricePesewas: e.price,
      })),
    ];
    addToCart(createCartItem(product, selected, qty));
  }

  return (
    <div className="bg-white pb-[calc(9.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="relative h-[280px] w-full bg-brand-sand">
        <Image src={product.imageUrl} alt={product.imageAlt} fill priority sizes="100vw" className="object-cover" />
        <Link
          href="/menu"
          aria-label="Back to menu"
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/80 text-gray-800 shadow-sm backdrop-blur-sm"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <span className="absolute right-4 top-4 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
          1/1
        </span>
      </div>

      <div className="px-4 pb-4">
        <div className="mt-4 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-gray-900">{product.name}</h1>
          <p className="shrink-0 text-2xl font-extrabold text-[#15803D]">{formatGhs(base)}</p>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Star className="size-4 fill-[#FACC15] text-[#FACC15]" aria-hidden="true" />
          {rating.toFixed(1)} <span className="font-medium text-gray-500">({ratingLabel} reviews)</span>
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {product.description || "Freshly prepared with quality ingredients, served hot and full of flavor."}
        </p>

        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <UtensilsCrossed className="size-4 text-[#14532D]" aria-hidden="true" /> Choose Size
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {SIZES.map((s) => {
              const active = sizeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSizeId(s.id)}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all",
                    active ? "border-[#14532D] bg-[#F5F7EE]" : "border-gray-200 bg-white",
                  )}
                >
                  <span className={cn("text-sm font-bold", active ? "text-[#14532D]" : "text-gray-900")}>{s.name}</span>
                  <span className={cn("mt-0.5 text-xs font-semibold", active ? "text-[#14532D]" : "text-gray-600")}>
                    {`GH₵ ${((base + s.add) / 100).toFixed(0)}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#14532D] text-white">
              <Plus className="size-3" strokeWidth={3} />
            </span>
            Add Extras <span className="font-medium text-gray-500">(Optional)</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {EXTRAS.map((e) => {
              const checked = extras.includes(e.id);
              return (
                <label
                  key={e.id}
                  className="relative flex cursor-pointer flex-col justify-between rounded-2xl border border-gray-200 bg-white p-3"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleExtra(e.id)}
                    className="absolute right-2.5 top-2.5 size-4 rounded border-gray-300 text-[#14532D] focus:ring-[#14532D]"
                    aria-label={`Add ${e.name}`}
                  />
                  <div className="relative mt-1 h-14 w-full overflow-hidden rounded-lg bg-gray-50">
                    <Image src={e.image} alt={e.name} fill sizes="30vw" className="object-cover" />
                  </div>
                  <div className="mt-2 pr-4">
                    <p className="text-xs font-bold leading-tight text-gray-900">{e.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#15803D]">{`+ GH₵ ${(e.price / 100).toFixed(0)}`}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 -mx-4 mt-6 border-t border-gray-100 bg-white/98 px-4 pb-3 pt-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 rounded-full bg-gray-100 px-3 py-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="text-gray-900 disabled:opacity-40"
                disabled={qty <= 1}
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-4 text-center text-sm font-bold text-gray-900">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(MAX_CART_QUANTITY, q + 1))}
                aria-label="Increase quantity"
                className="text-gray-900 disabled:opacity-40"
                disabled={qty >= MAX_CART_QUANTITY}
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!isStoreOpen || !product.isAvailable}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14532D] px-6 py-3.5 font-bold text-white shadow-lg hover:bg-[#113E24] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="size-5" /> Add to Cart <span className="font-extrabold">· {formatGhs(total)}</span>
            </button>
          </div>
        </div>

        <div className="mb-20 mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#F5F7EE] px-4 py-3 text-xs font-semibold text-[#14532D]">
          <Check className="size-4" aria-hidden="true" /> <span>Freshly prepared</span> <span>•</span> <span>Fast delivery</span>
        </div>
      </div>
    </div>
  );
}
