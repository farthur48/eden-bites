import type { ReactNode } from "react";

import { HideOnHome } from "@/components/layout/hide-on-home";
import { HideOnLogin } from "@/components/layout/hide-on-login";
import { HideOnMenuDetail } from "@/components/layout/hide-on-menu-detail";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-green focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-brand-white"
      >
        Skip to content
      </a>
      <HideOnLogin>
        <SiteHeader />
      </HideOnLogin>
      <main id="main-content" className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
      <HideOnLogin>
        <HideOnHome>
          <HideOnMenuDetail>
            <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
              <SiteFooter />
            </div>
          </HideOnMenuDetail>
        </HideOnHome>
        <MobileBottomNav />
      </HideOnLogin>
    </div>
  );
}
