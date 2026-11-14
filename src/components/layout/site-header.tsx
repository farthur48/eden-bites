import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { CartLink } from "@/components/cart/cart-link";
import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteNav } from "@/components/layout/site-nav";
import { buttonStyles } from "@/components/ui/button";
import { getPublicBusinessProfile } from "@/lib/data/settings";

export async function SiteHeader() {
  const profile = await getPublicBusinessProfile();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <Container className="flex h-[4.5rem] items-center justify-between gap-4 lg:h-20">
        <div className="flex min-w-0 items-center gap-8">
          <BrandLogo logoUrl={profile.settings?.logo_url} />
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
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
