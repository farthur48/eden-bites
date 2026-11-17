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
    <section className="bg-white">
      <Container className="px-4 pb-4 pt-2 sm:px-6">
        <CheckoutForm store={store} pickupInstructions={profile.pickupInstructions} />
      </Container>
    </section>
  );
}
