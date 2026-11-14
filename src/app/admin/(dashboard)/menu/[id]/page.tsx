import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuForm } from "@/components/admin/menu-form";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminMenuProduct } from "@/lib/data/menu-admin";
import { hasPublicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Edit meal",
  robots: { index: false, follow: false },
};

export default async function EditMenuProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!hasPublicEnv()) {
    return (
      <EmptyState
        eyebrow="Database"
        title="Connect Supabase to edit meals"
        description="Add your Supabase credentials and apply the migrations first."
        action={
          <Link href="/admin/menu" className={buttonStyles({ variant: "outline" })}>
            Back to menu
          </Link>
        }
      />
    );
  }

  const product = await getAdminMenuProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/menu"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-green/60 transition-colors hover:text-brand-green"
          >
            <span aria-hidden="true">&larr;</span> Back to menu
          </Link>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-green">
            Edit {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Update the details, image or customization options. Changes appear
            on the public menu immediately.
          </p>
        </div>
        <Link
          href="/menu"
          target="_blank"
          className={buttonStyles({ variant: "outline", size: "sm" })}
        >
          View public menu
        </Link>
      </div>

      <MenuForm product={product} />
    </div>
  );
}
