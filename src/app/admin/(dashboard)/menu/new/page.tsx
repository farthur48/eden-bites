import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MenuForm } from "@/components/admin/menu-form";

export const metadata: Metadata = {
  title: "Add meal",
  robots: { index: false, follow: false },
};

export default function NewMenuProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/menu"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand-green-deep"
        >
          <ArrowLeft className="size-4" /> Back to menu
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep">
          Add New Meal
        </h1>
        <p className="mt-1 text-sm text-muted">
          Create a new menu item with pricing, image, and customization options.
        </p>
      </div>
      <MenuForm />
    </div>
  );
}