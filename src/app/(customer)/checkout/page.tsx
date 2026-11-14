import type { Metadata } from "next";

import { CheckoutForm } from "@/app/(customer)/checkout/checkout-form";
import { Container } from "@/components/layout/container";
import { getPublicBusinessProfile } from "@/lib/data/settings";
import { getStoreAvailability } from "@/lib/store/availability";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Eden Bites order.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [store, profile] = await Promise.all([
    getStoreAvailability(),
    getPublicBusinessProfile(),
  ]);

  return (
    <section className="bg-background py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="mb-8 sm:mb-10">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-brand-green/60">
            Checkout
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep sm:text-4xl">
            Complete your order
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
            Add your details and choose delivery or pickup. No online payment is required.
          </p>
        </div>
        <CheckoutForm store={store} pickupInstructions={profile.pickupInstructions} />
      </Container>
    </section>
  );
}
