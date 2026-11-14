import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { getCurrentUser } from "@/lib/auth";
import { getAdminEmails, isAdminEmail } from "@/lib/auth/admin-email";
import { hasPublicEnv } from "@/lib/env";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

const errorMessages: Record<string, string> = {
  unauthorized: "That account is not authorized for the admin dashboard.",
  not_configured: "Admin sign-in is not configured yet.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = hasPublicEnv();

  if (configured) {
    const user = await getCurrentUser();
    if (user && isAdminEmail(user.email)) redirect("/admin");
  }

  const errorMessage = params.error ? errorMessages[params.error] : undefined;
  const showEmailWarning =
    process.env.NODE_ENV !== "production" && configured && getAdminEmails().length === 0;

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-brand-green-deep lg:block">
        <Image
          src="/menu/banku-tilapia.jpg"
          alt="Freshly prepared Ghanaian meal"
          fill
          priority
          sizes="55vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-green-deep/90 via-brand-green-deep/50 to-brand-green-deep/30" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <BrandLogo variant="light" href="/" />
          <div className="max-w-md">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-brand-lime">
              Eden Bites Admin
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-white xl:text-5xl">
              Manage orders, menu, and your kitchen with ease.
            </h1>
            <p className="mt-4 text-base leading-7 text-brand-cream/75">
              A simple, secure space to keep Eden Bites running smoothly.
            </p>
          </div>
          <p className="text-xs text-brand-cream/45">Authorized staff access only.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo href="/" />
          </div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-brand-green/60">
            Administrator
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-brand-green-deep">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Sign in to access the Eden Bites dashboard.
          </p>

          {errorMessage ? (
            <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMessage}
            </p>
          ) : null}

          {showEmailWarning ? (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No admin emails are configured. Add an address to ADMIN_EMAILS in your environment.
            </p>
          ) : null}

          <div className="mt-8">
            {configured ? (
              <LoginForm nextPath={params.next} />
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-brand-green/25 bg-brand-cream/50 p-6">
                <h3 className="font-display text-lg font-bold text-brand-green-deep">
                  Supabase is not connected
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Add your Supabase credentials and ADMIN_EMAILS to <code className="rounded bg-white px-1.5 py-0.5 text-xs">.env.local</code>, then restart the app.
                </p>
              </div>
            )}
          </div>

          <p className="mt-8 text-sm text-muted">
            <Link href="/" className="font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4">
              Return to the website
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
