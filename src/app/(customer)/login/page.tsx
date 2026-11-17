import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck, Truck, UtensilsCrossed } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";

import { CustomerAuthForm } from "./auth-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in or create an account at Eden Bites.",
};

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  const params = await searchParams;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-white -mb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:mb-0">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-[#F2F8E4]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 bottom-24 h-72 w-72 rounded-[45%] bg-[#F2F8E4]" />

      <header className="relative flex items-center justify-between px-6 pt-6">
        <div className="leading-tight">
          <p className="font-display text-2xl font-bold italic text-[#14532D]">Eden Bites</p>
          <p className="text-[11px] font-medium text-gray-700">Life In Every Bite.</p>
        </div>
        <div className="relative -mr-4 h-24 w-28">
          <span className="absolute -left-1 top-2 flex flex-col gap-1" aria-hidden="true">
            <span className="block h-3 w-0.5 rotate-[-25deg] rounded-full bg-[#A3E635]" />
            <span className="ml-1 block h-4 w-0.5 rotate-[-10deg] rounded-full bg-[#A3E635]" />
            <span className="block h-3 w-0.5 rotate-[5deg] rounded-full bg-[#A3E635]" />
          </span>
          <Image
            src="/menu/banku-tilapia.jpg"
            alt=""
            fill
            sizes="7rem"
            className="rounded-l-full object-cover object-left"
            priority
          />
        </div>
      </header>

      <main className="relative flex-1 px-6 pb-2 pt-4">
        <CustomerAuthForm nextPath={params.next} />
      </main>

      <footer className="relative mt-8 grid grid-cols-3 divide-x divide-gray-300 bg-[#F4F6EE] px-6 py-4 text-center text-xs font-semibold text-[#14532D]">
        <div className="flex flex-col items-center gap-1 px-1">
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          <span>Delicious Meals</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-1">
          <Truck className="size-4" aria-hidden="true" />
          <span>Fast Delivery</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-1">
          <ShieldCheck className="size-4" aria-hidden="true" />
          <span>Secure &amp; Reliable</span>
        </div>
      </footer>
    </div>
  );
}
