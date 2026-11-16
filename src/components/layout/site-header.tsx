import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { CartLink } from "@/components/cart/cart-link";
import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
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

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <Container className="flex h-[4.5rem] items-center justify-between gap-4 lg:h-20">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <BrandLogo logoUrl={profile.settings?.logo_url} />
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] sm:inline-flex",
              store.isOpen
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800",
            )}
            title={store.message}
          >
            <span className={cn("size-1.5 rounded-full", store.isOpen ? "bg-emerald-500" : "bg-amber-500")} />
            {store.label}
          </span>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <SiteNav />
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <CartLink />
          <Link
            href="/menu"
            className={buttonStyles({
              variant: "accent",
              size: "md",
              className: "hidden sm:inline-flex",
            })}
          >
            Order Now
          </Link>
          <MobileNav storeLabel={store.label} isStoreOpen={store.isOpen} />
        </div>
      </Container>
    </header>
  );
}
