import type { ReactNode } from "react";
import { Bell, UserCircle2 } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AdminNav } from "@/components/layout/admin-nav";

export function AdminShell({
  email,
  newOrderCount,
  logoUrl,
  children,
}: {
  email: string;
  newOrderCount: number;
  logoUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f4f5f1]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-brand-green-deep/10 bg-brand-green-deep lg:flex">
        <div className="flex h-[4.5rem] items-center border-b border-white/10 px-6">
          <BrandLogo variant="light" compact href="/admin" logoUrl={logoUrl} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <AdminNav newOrderCount={newOrderCount} />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-white/95 backdrop-blur">
          <div className="flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandLogo compact href="/admin" logoUrl={logoUrl} />
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative inline-flex size-10 items-center justify-center rounded-xl text-brand-green-deep transition-colors hover:bg-brand-cream"
              >
                <Bell className="size-5" strokeWidth={1.8} />
                {newOrderCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-lime ring-2 ring-white" />
                ) : null}
              </button>
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-white px-2.5 py-1.5 sm:px-3">
                <UserCircle2 className="size-5 text-brand-green/60" strokeWidth={1.6} />
                <span className="hidden max-w-[12rem] truncate text-xs font-medium text-brand-green-deep sm:block">
                  {email}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-border/70 px-4 py-2 lg:hidden">
            <AdminNav newOrderCount={newOrderCount} mobile />
          </div>
        </header>

        <main id="main-content" className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
