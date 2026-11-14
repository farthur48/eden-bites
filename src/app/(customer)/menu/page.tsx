import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { MenuExperience } from "@/components/menu/menu-experience";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getMenuProducts } from "@/lib/menu/catalog";
import { getStoreAvailability } from "@/lib/store/availability";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Explore the Eden Bites menu and choose a freshly prepared meal for delivery or pickup.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Menu | Eden Bites",
    description:
      "Explore the Eden Bites menu and choose a freshly prepared meal for delivery or pickup.",
    url: "/menu",
  },
};

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [menu, store] = await Promise.all([
    getMenuProducts(),
    getStoreAvailability(),
  ]);
  const products = menu.products;

  return (
    <>
      <section className="border-b border-border/70 bg-brand-cream/40">
        <Container className="py-14 sm:py-18 lg:py-20">
          <SectionHeading
            align="center"
            eyebrow="Menu"
            title="Explore Our Menu"
            description="Discover delicious meals prepared to make every bite memorable."
            className="mx-auto"
          />
          {!store.isOpen ? (
            <p className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-medium text-amber-900">
              {store.message || "Orders are currently paused. You can still explore the menu."}
            </p>
          ) : null}
        </Container>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {products.length > 0 ? (
            <>
              <MenuExperience products={products} store={store} ctaLabel="Customize & Order" />
              <p className="mt-10 text-center text-xs font-medium uppercase tracking-[0.16em] text-brand-green/50">
                Pay on delivery or pickup. No online payment needed.
              </p>
              <div className="mt-3 text-center">
                <Link
                  href="/credits"
                  className="text-xs text-brand-green/45 underline decoration-brand-green/20 underline-offset-4 hover:text-brand-green"
                >
                  Photo credits
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              eyebrow="Menu"
              title="Our menu is being prepared"
              description="Fresh meals will appear here soon. Please check back shortly."
            />
          )}
        </Container>
      </section>
    </>
  );
}
