import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/layout/container";
import { getStoreAvailability } from "@/lib/store/availability";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your Eden Bites order before checkout.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const store = await getStoreAvailability();

  return (
    <section className="bg-white">
      <Container className="px-4 pt-2 pb-2 sm:px-6">
        <CartView store={store} />
      </Container>
    </section>
  );
}
