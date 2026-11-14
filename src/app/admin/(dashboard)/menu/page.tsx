import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminMenuProducts } from "@/lib/data/menu-admin";
import { formatGhs } from "@/lib/format";
import { resolveImageUrl } from "@/lib/images";

import { toggleMenuProductAction } from "./actions";

export const metadata: Metadata = {
  title: "Menu management",
  robots: { index: false, follow: false },
};

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ saved }, result] = await Promise.all([searchParams, getAdminMenuProducts()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep">
            Menu Management
          </h1>
          <p className="mt-1 text-sm text-muted">Add meals, update prices, and control availability.</p>
        </div>
        <Link href="/admin/menu/new" className={buttonStyles({ variant: "accent" })}>
          <Plus className="size-4" />
          Add New Meal
        </Link>
      </div>

      {saved && saved !== "error" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Menu updated successfully.
        </p>
      ) : saved === "error" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          That action could not be completed.
        </p>
      ) : null}

      {result.status === "setup" || result.status === "error" ? (
        <EmptyState
          eyebrow="Menu"
          title="Menu unavailable"
          description="Connect Supabase and apply migrations to manage meals."
        />
      ) : null}

      {result.status === "ready" && result.products.length === 0 ? (
        <EmptyState
          eyebrow="Menu"
          title="No meals yet"
          description="Add your first meal to display it on the public menu."
          action={<Link href="/admin/menu/new" className={buttonStyles({ variant: "accent" })}>Add a meal</Link>}
        />
      ) : null}

      {result.status === "ready" && result.products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {result.products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white"
            >
              <div className="relative aspect-[4/3] bg-brand-sand">
                <Image
                  src={resolveImageUrl(product.image_url)}
                  alt={product.image_alt || product.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3">
                  <Badge variant={product.is_active ? "success" : "muted"}>
                    {product.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-brand-green-deep">
                    {product.name}
                  </h2>
                  <p className="shrink-0 font-display text-lg font-extrabold text-brand-green-deep">
                    {formatGhs(product.price_pesewas)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {product.groups.length} customization {product.groups.length === 1 ? "group" : "groups"}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
                  <Link
                    href={`/admin/menu/${product.id}`}
                    className={buttonStyles({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                  <ConfirmForm
                    action={toggleMenuProductAction}
                    message={
                      product.is_active
                        ? `Hide ${product.name} from the public menu?`
                        : `Make ${product.name} visible on the public menu?`
                    }
                  >
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="isActive" value={product.is_active ? "false" : "true"} />
                    <button
                      type="submit"
                      className={buttonStyles({ variant: product.is_active ? "ghost" : "accent", size: "sm" })}
                    >
                      {product.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </ConfirmForm>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
