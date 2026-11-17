import Link from "next/link";
import { ChevronDown, ChefHat, MapPin, Settings } from "lucide-react";

import { CartLink } from "@/components/cart/cart-link";
import { Container } from "@/components/layout/container";
import { HideOnAccount, ShowOnAccount } from "@/components/layout/account-route-visibility";
import { HideOnCart } from "@/components/layout/hide-on-cart";
import { SiteNav } from "@/components/layout/site-nav";
import { buttonStyles } from "@/components/ui/button";
import { getPublicBusinessProfile } from "@/lib/data/settings";
import { getStoreAvailability } from "@/lib/store/availability";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const [profile, store] = await Promise.all([
    getPublicBusinessProfile(),
    getStoreAvailability(),
  ]);
  const location = profile.contact.address?.split(",")[0]?.trim() || "Accra";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <Container className="flex h-14 items-center justify-between gap-2 lg:h-20">
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <Link href="/" className="flex shrink-0 flex-col leading-none" aria-label="Eden Bites home">
            <span className="relative inline-flex items-end pr-1">
              <ChefHat className="absolute -top-2.5 left-0 size-4 text-[#14532D]" strokeWidth={2.2} aria-hidden="true" />
              <span className="pl-3 font-display text-[1.35rem] font-semibold italic tracking-tight text-[#84CC16]" style={{ fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif" }}>
                Eden Bites
              </span>
            </span>
            <span className="mt-0.5 pl-3 text-[0.5rem] font-medium tracking-wide text-black">Life In Every Bite.</span>
          </Link>
        </div>

        <div className="hidden min-w-0 items-center gap-4 lg:flex">
          <Link href="/" className="font-display text-2xl font-semibold text-brand-green">Eden Bites</Link>
          <span
            className={cn(
              "items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] inline-flex",
              store.isOpen ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800",
            )}
            title={store.message}
          >
            <span className={cn("size-1.5 rounded-full", store.isOpen ? "bg-emerald-500" : "bg-amber-500")} />
            {store.label}
          </span>
        </div>

        <HideOnCart className="flex flex-1 justify-center px-1 lg:hidden">
          <button
            type="button"
            className="inline-flex max-w-[10rem] items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-left"
            aria-label={`Location: ${location}`}
          >
            <MapPin className="size-4 shrink-0 text-black" aria-hidden="true" />
            <span className="truncate text-sm font-medium text-gray-900">{location}</span>
            <ChevronDown className="size-4 shrink-0 text-gray-700" aria-hidden="true" />
          </button>
        </HideOnCart>

        <div className="hidden flex-1 justify-center lg:flex">
          <SiteNav />
        </div>

        <div className="flex items-center justify-end gap-1">
          <HideOnAccount>
            <CartLink />
          </HideOnAccount>
          <ShowOnAccount>
            <button
              type="button"
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-800 shadow-sm"
            >
              <Settings className="size-5" aria-hidden="true" />
            </button>
          </ShowOnAccount>
          <Link href="/menu" className={buttonStyles({ variant: "accent", size: "md", className: "hidden lg:inline-flex" })}>
            Order Now
          </Link>
        </div>
      </Container>
    </header>
  );
}
