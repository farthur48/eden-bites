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
    <section className="bg-background py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="mb-8 sm:mb-10">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-brand-green/60">
            Your order
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep sm:text-4xl">
            Your cart
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
            Review your meals and proceed to checkout when you are ready.
          </p>
        </div>
        <CartView store={store} />
      </Container>
    </section>
  );
}
