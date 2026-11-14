"use client";

import Image from "next/image";

import { buttonStyles } from "@/components/ui/button";
import { formatGhs } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu/types";

export function ProductCard({
  product,
  isStoreOpen,
  onSelect,
  priority = false,
  ctaLabel = "Customize & Order",
}: {
  product: MenuProduct;
  isStoreOpen: boolean;
  onSelect: (product: MenuProduct) => void;
  priority?: boolean;
  ctaLabel?: string;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-border/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(20,20,20,0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-sand">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-brand-green-deep sm:text-[1.35rem]">
            {product.name}
          </h3>
          <p className="shrink-0 font-display text-lg font-extrabold tracking-tight text-brand-green-deep">
            {formatGhs(product.pricePesewas)}
          </p>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
          {product.description}
        </p>

        <button
          type="button"
          onClick={() => onSelect(product)}
          disabled={!isStoreOpen}
          aria-haspopup="dialog"
          className={buttonStyles({
            variant: isStoreOpen ? "accent" : "outline",
            size: "md",
            className: "mt-5 w-full",
          })}
        >
          {isStoreOpen ? ctaLabel : "Currently unavailable"}
        </button>
      </div>
    </article>
  );
}
