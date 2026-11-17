import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { CategoryShortcuts } from "@/components/home/category-shortcuts";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { HomeSearchBar } from "@/components/home/home-search-bar";
import { Container } from "@/components/layout/container";
import { MenuExperience } from "@/components/menu/menu-experience";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getMenuProducts } from "@/lib/menu/catalog";
import { getStoreAvailability } from "@/lib/store/availability";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [menu, store] = await Promise.all([
    getMenuProducts(),
    getStoreAvailability(),
  ]);
  const products = menu.products;
  const heroSlides = (products.filter((p) => p.isFeatured).length > 0
    ? products.filter((p) => p.isFeatured)
    : products
  ).slice(0, 3);
  const popular = (products.filter((p) => p.isFeatured).length >= 4
    ? products.filter((p) => p.isFeatured)
    : products
  ).slice(0, 4);

  return (
    <div className="bg-white">
      {/* B. Search Bar */}
      <section className="pt-3 lg:pt-8">
        <Container>
          <HomeSearchBar />
        </Container>
      </section>

      {/* C. Hero Section */}
      <section className="pt-4">
        <Container>
          <HeroCarousel products={heroSlides} />
          {!store.isOpen ? (
            <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
              {store.message || "Orders currently paused"}
            </p>
          ) : null}
        </Container>
      </section>

      {/* D. Food Categories */}
      <section className="pt-5">
        <Container>
          <CategoryShortcuts />
        </Container>
      </section>

      {/* E. Popular Menu */}
      <section className="pt-6">
        <Container>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#A3E635]" aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900">Popular Menu</h2>
            </div>
            <Link href="/menu" className="inline-flex items-center gap-0.5 text-sm font-medium text-gray-800">
              See all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {popular.length > 0 ? (
            <MenuExperience
              products={popular}
              store={store}
              showControls={false}
              compactCards
              cardVariant="grid"
              linkToDetail
            />
          ) : (
            <EmptyState
              eyebrow="Menu"
              title="Our menu is being prepared"
              description="Fresh meals will appear here soon."
              action={<Link href="/menu" className={buttonStyles()}>Visit the menu</Link>}
            />
          )}
        </Container>
      </section>

      {/* F. Promotional Banner */}
      <section className="pb-2 pt-5">
        <Container>
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#143D1D] to-[#1E562A] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative inline-flex size-10 shrink-0 items-center justify-center text-[#A3E635]">
                <span className="absolute -top-1 flex gap-0.5" aria-hidden="true">
                  <span className="block h-1.5 w-[2px] -rotate-12 rounded-full bg-[#A3E635]" />
                  <span className="block h-2 w-[2px] rounded-full bg-[#A3E635]" />
                  <span className="block h-1.5 w-[2px] rotate-12 rounded-full bg-[#A3E635]" />
                </span>
                <svg className="mt-1 size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 14h18" />
                  <path d="M5 14a7 7 0 0 1 14 0" />
                  <path d="M12 5v2" />
                  <path d="M8 19h8" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight text-white">
                  Cravings? <span className="text-[#A3E635]">We&apos;ve Got You!</span>
                </h2>
                <p className="mt-0.5 text-xs leading-snug text-gray-200">Enjoy great meals with fast delivery.</p>
              </div>
            </div>
            <Link
              href="/menu"
              aria-label="See menu"
              className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A3E635] text-black transition-colors hover:bg-[#93d62b]"
            >
              <ChevronRight className="size-5" strokeWidth={2.6} aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
