"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, Plus, Star } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { formatGhs } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

function formatGhsCompact(pesewas: number): string {
  const v = pesewas / 100;
  return `GH₵ ${Number.isInteger(v) ? v.toFixed(0) : v.toString().replace(/\.00$/, "")}`;
}

export function ProductCard({
  product,
  isStoreOpen,
  priority = false,
  ctaLabel = "Customize & Order",
  compact = false,
  variant = "default",
}: {
  product: MenuProduct;
  isStoreOpen: boolean;
  priority?: boolean;
  ctaLabel?: string;
  compact?: boolean;
  variant?: "default" | "grid";
}) {
  const available = isStoreOpen && product.isAvailable;
  const rating = (product as MenuProduct & { rating?: number; ratingCount?: number }).rating;
  const ratingCount = (product as MenuProduct & { rating?: number; ratingCount?: number }).ratingCount;
  const href = `/menu/${product.slug || product.id}`;

  if (variant === "grid") {
    return (
      <article className="flex flex-col rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
        <Link href={href} className="block" aria-label={`View ${product.name}`}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-sand">
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              priority={priority}
              sizes="(min-width: 640px) 50vw, 45vw"
              className={cn("object-cover", !available && "grayscale-[25%]")}
            />
            {typeof rating === "number" ? (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-gray-900 shadow-sm">
                <Star className="size-3 fill-[#FACC15] text-[#FACC15]" aria-hidden="true" />
                {rating.toFixed(1)}{typeof ratingCount === "number" ? ` (${ratingCount >= 1000 ? `${(ratingCount / 1000).toFixed(1).replace(/\.0$/, "")}k` : ratingCount})` : ""}
              </span>
            ) : null}
            {!product.isAvailable ? (
              <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">Sold out</span>
            ) : !isStoreOpen ? (
              <span className="absolute bottom-2 left-2 rounded-full bg-amber-100/95 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-amber-900">Paused</span>
            ) : null}
          </div>
        </Link>
        <div className="mt-2 flex flex-1 flex-col">
          <Link href={href} className="block">
            <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{product.name}</h3>
          </Link>
          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="text-sm font-extrabold text-[#15803D]">{formatGhsCompact(product.pricePesewas)}</p>
            <Link
              href={href}
              aria-label={available ? `View ${product.name}` : `${product.name} unavailable`}
              aria-disabled={!available}
              tabIndex={available ? 0 : -1}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]",
                available ? "bg-[#A3E635] text-black hover:bg-[#93d62b]" : "pointer-events-none bg-gray-200 text-gray-500",
              )}
            >
              <Plus className="size-4" strokeWidth={3} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-border/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(20,20,20,0.35)]">
      <Link href={href} className="relative block overflow-hidden bg-brand-sand" aria-label={`View ${product.name}`}>
        <div className={cn("relative", compact ? "aspect-[16/10]" : "aspect-[4/3]")}>
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", !available && "grayscale-[25%]")}
          />
        </div>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {!product.isAvailable ? (
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">Sold out</span>
          ) : !isStoreOpen ? (
            <span className="rounded-full bg-amber-100/95 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-900">Orders paused</span>
          ) : product.isFeatured ? (
            <span className="rounded-full bg-brand-lime px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-black">Popular</span>
          ) : null}
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col", compact ? "p-4 sm:p-5" : "p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={href} className="block">
              <h3 className={cn("font-display font-bold leading-tight tracking-[-0.02em] text-brand-green-deep", compact ? "text-lg sm:text-xl" : "text-xl sm:text-[1.35rem]")}>
                {product.name}
              </h3>
            </Link>
            {!compact && product.tagline ? <p className="mt-0.5 text-xs font-medium text-brand-green/60">{product.tagline}</p> : null}
          </div>
          <p className={cn("shrink-0 font-display font-extrabold tracking-tight text-brand-green-deep", compact ? "text-base sm:text-lg" : "text-lg")}>
            {formatGhs(product.pricePesewas)}
          </p>
        </div>

        <p className={cn("mt-2 text-sm leading-6 text-muted", compact ? "line-clamp-1" : "line-clamp-2")}>{product.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold text-brand-green/60">
          {product.prepMinutes ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-cream px-2 py-1"><Clock3 className="size-3" /> {product.prepMinutes} min</span>
          ) : null}
          {!compact && product.serves ? <span className="rounded-full bg-brand-cream px-2 py-1">{product.serves}</span> : null}
          {!compact && (product.tags ?? []).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-brand-cream px-2 py-1">{tag}</span>
          ))}
        </div>
        {!compact && product.allergenNote ? <p className="mt-2 line-clamp-1 text-[0.68rem] text-muted">{product.allergenNote}</p> : null}

        {available ? (
          <Link href={href} className={buttonStyles({ variant: "accent", size: compact ? "sm" : "md", className: "mt-4 w-full sm:mt-5" })}>
            {ctaLabel}
          </Link>
        ) : (
          <span className={buttonStyles({ variant: "outline", size: compact ? "sm" : "md", className: "mt-4 w-full cursor-not-allowed opacity-70 sm:mt-5" })}>
            {!isStoreOpen ? "Orders paused" : "Currently unavailable"}
          </span>
        )}
      </div>
    </article>
  );
}
