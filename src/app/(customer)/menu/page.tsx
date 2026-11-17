import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { HomeSearchBar } from "@/components/home/home-search-bar";
import { MenuPageExperience } from "@/components/menu/menu-page-experience";
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

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [menu, store] = await Promise.all([
    getMenuProducts(),
    getStoreAvailability(),
  ]);

  return (
    <div className="bg-white">
      <section className="pb-2 pt-3">
        <Container>
          <MenuPageExperience
            key={`${params.q ?? ""}|${params.category ?? ""}`}
            products={menu.products}
            store={store}
            initialQuery={params.q ?? ""}
            initialCategory={params.category ?? ""}
          />
        </Container>
      </section>
    </div>
  );
}
