"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, UtensilsCrossed } from "lucide-react";

import type { MenuProduct } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

export function HeroCarousel({ products }: { products: MenuProduct[] }) {
  const slides = products.length > 0 ? products.slice(0, 3) : [null];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const current = slides[index];
  const showDots = slides.length > 1;

  return (
    <>
      <div className="relative h-[210px] overflow-hidden rounded-3xl bg-gradient-to-r from-[#F5F7EE] to-[#EBF5D6]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] rounded-l-[120px] bg-[#14532D]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-10 right-[-8%] h-[130%] w-[50%] rounded-full bg-[#14532D]" aria-hidden="true" />

        <div className="relative z-10 flex h-full">
          <div className="flex w-[55%] flex-col justify-center pl-4 pr-1 sm:pl-6">
            <h1 className="mb-1 text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
              Good Food,<br />Good Mood
            </h1>
            <p className="mt-1.5 max-w-[11.5rem] text-xs text-gray-700">
              Delicious meals, freshly prepared for you.
            </p>
            <div className="mt-4">
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#A3E635] px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-[#93d62b]"
              >
                Order Now <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative w-[45%]">
            <div className="absolute right-[-12%] top-1/2 aspect-square h-[82%] -translate-y-1/2 overflow-hidden rounded-full shadow-lg">
              {current ? (
                <Image
                  src={current.imageUrl}
                  alt={current.imageAlt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 640px) 220px, 45vw"
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-sand text-brand-green-deep">
                  <UtensilsCrossed className="size-10 opacity-40" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden={showDots ? undefined : true}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-4 bg-[#14532D]" : "w-1.5 bg-gray-300",
              !showDots && "pointer-events-none",
            )}
          />
        ))}
      </div>
    </>
  );
}
