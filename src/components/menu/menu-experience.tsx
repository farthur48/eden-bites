"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProductCard } from "@/components/menu/product-card";
import { ProductCustomizer } from "@/components/menu/product-customizer";
import type { MenuProduct } from "@/lib/menu/types";
import type { StoreAvailability } from "@/lib/store/availability";

export function MenuExperience({
  products,
  store,
  ctaLabel,
}: {
  products: MenuProduct[];
  store: StoreAvailability;
  ctaLabel?: string;
}) {
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(
    null,
  );
  const [addedProductName, setAddedProductName] = useState<string | null>(null);

  useEffect(() => {
    if (!addedProductName) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAddedProductName(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [addedProductName]);

  function handleAdded(productName: string) {
    setSelectedProduct(null);
    setAddedProductName(productName);
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            isStoreOpen={store.isOpen}
            onSelect={setSelectedProduct}
            priority={index === 0}
            ctaLabel={ctaLabel}
          />
        ))}
      </div>

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
          className="fixed bottom-5 left-1/2 z-[80] flex w-[min(calc(100%-2rem),26rem)] -translate-x-1/2 items-center justify-between gap-4 rounded-full border border-brand-green/10 bg-brand-white px-5 py-3.5 shadow-2xl shadow-brand-green/20"
        >
          <p className="text-sm font-semibold text-brand-green">
            {addedProductName} added
          </p>
          <Link
            href="/cart"
            className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-brand-green underline decoration-brand-lime decoration-2 underline-offset-4"
          >
            View cart
          </Link>
        </div>
      ) : null}
    </>
  );
}
