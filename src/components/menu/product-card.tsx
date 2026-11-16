"use client";

import Image from "next/image";
import { Clock3 } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { formatGhs } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

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
  const available = isStoreOpen && product.isAvailable;
  return (
    <article className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-border/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(20,20,20,0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-sand">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", !available && "grayscale-[25%]")}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {!product.isAvailable ? (
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">Sold out</span>
          ) : !isStoreOpen ? (
            <span className="rounded-full bg-amber-100/95 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-900">Orders paused</span>
          ) : product.isFeatured ? (
            <span className="rounded-full bg-brand-lime px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-black">Popular</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-brand-green-deep sm:text-[1.35rem]">
              {product.name}
            </h3>
            {product.tagline ? <p className="mt-0.5 text-xs font-medium text-brand-green/60">{product.tagline}</p> : null}
          </div>
          <p className="shrink-0 font-display text-lg font-extrabold tracking-tight text-brand-green-deep">
            {formatGhs(product.pricePesewas)}
          </p>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold text-brand-green/60">
          {product.prepMinutes ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-cream px-2 py-1"><Clock3 className="size-3" /> {product.prepMinutes} min</span>
          ) : null}
          {product.serves ? <span className="rounded-full bg-brand-cream px-2 py-1">{product.serves}</span> : null}
          {(product.tags ?? []).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-brand-cream px-2 py-1">{tag}</span>
          ))}
        </div>
        {product.allergenNote ? <p className="mt-2 line-clamp-1 text-[0.68rem] text-muted">{product.allergenNote}</p> : null}

        <button
          type="button"
          onClick={() => onSelect(product)}
          disabled={!available}
          aria-haspopup="dialog"
          className={buttonStyles({
            variant: available ? "accent" : "outline",
            size: "md",
            className: "mt-5 w-full",
          })}
        >
          {available ? ctaLabel : !isStoreOpen ? "Orders paused" : "Currently unavailable"}
        </button>
      </div>
    </article>
  );
}
