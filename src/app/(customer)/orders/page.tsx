import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

import { OrdersView } from "./orders-view";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Track and manage your orders.",
};

export default function OrdersPage() {
  return (
    <section className="bg-white">
      <Container className="px-4 pb-4 pt-2 sm:px-6">
        <OrdersView />
      </Container>
    </section>
  );
}
