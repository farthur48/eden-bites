import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Check, Headphones, Home, Info, List } from "lucide-react";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default function OrderConfirmationStaticPage() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-[#F2F8E4]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-44 h-52 w-52 rounded-[45%] bg-[#F2F8E4]" />
      <Container className="relative px-4 pb-6 pt-2 sm:px-6">
        <div className="mb-5 mt-2 flex flex-col items-center text-center">
          <div className="relative">
            <span className="absolute -left-6 top-2 flex flex-col gap-1.5" aria-hidden="true">
              <span className="block h-3 w-1 rotate-[-35deg] rounded-full bg-[#A3E635]" />
              <span className="ml-1 block h-4 w-1 rotate-[-20deg] rounded-full bg-[#A3E635]" />
              <span className="block h-3 w-1 rotate-[-5deg] rounded-full bg-[#A3E635]" />
            </span>
            <span className="absolute -right-6 top-2 flex flex-col items-end gap-1.5" aria-hidden="true">
              <span className="block h-3 w-1 rotate-[35deg] rounded-full bg-[#A3E635]" />
              <span className="mr-1 block h-4 w-1 rotate-[20deg] rounded-full bg-[#A3E635]" />
              <span className="block h-3 w-1 rotate-[5deg] rounded-full bg-[#A3E635]" />
            </span>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#A3E635] ring-8 ring-[#EBF5D6]">
              <Check className="size-10 text-[#14532D]" strokeWidth={3.2} />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-[#14532D]">Order Placed!</h1>
          <p className="mt-1.5 max-w-[270px] text-sm leading-snug text-gray-600">
            Your order has been successfully placed. Thank you for choosing Eden Bites!
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-lg font-extrabold text-gray-900">Order #EB20261117</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A3E635] bg-[#EBF5D6] px-3 py-1 text-xs font-bold text-[#14532D]">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#14532D] text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
              Confirmed
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-2 border-b border-gray-100 pb-3.5 text-xs">
            <Calendar className="size-4 text-gray-500" aria-hidden="true" />
            <span className="text-gray-500">Order Date</span>
            <span className="font-bold text-gray-900">Nov 17, 2026 • 9:41 AM</span>
          </div>

          <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-brand-sand">
              <Image src="/menu/banku-tilapia.jpg" alt="Jollof Rice Combo" fill sizes="4rem" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">Jollof Rice Combo</p>
              <p className="mt-0.5 text-xs text-gray-500">Regular Size • Extra Chicken</p>
              <p className="mt-1 text-sm font-extrabold text-[#15803D]">GH₵ 70</p>
            </div>
            <p className="text-sm font-bold text-gray-900">x1</p>
          </div>

          <div className="space-y-2 pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Subtotal</span>
              <span className="font-bold text-gray-900">GH₵ 70</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-gray-700">Delivery Fee <Info className="size-3.5 text-gray-500" aria-hidden="true" /></span>
              <span className="font-bold text-gray-900">GH₵ 15</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F4F6EE] px-3.5 py-2.5">
            <span className="text-base font-extrabold text-[#14532D]">Total</span>
            <span className="text-lg font-extrabold text-[#15803D]">GH₵ 85</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Link href="/orders" className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#1E4620] py-3.5 text-base font-bold text-white shadow-sm hover:bg-[#143D1D]">
            <List className="size-5" aria-hidden="true" /> View My Orders
          </Link>
          <Link href="/" className="flex w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-[#14532D] bg-white py-3.5 text-base font-bold text-[#14532D] hover:bg-[#F4F6EE]">
            <Home className="size-5 text-[#14532D]" aria-hidden="true" /> Back to Home
          </Link>
        </div>

        <div className="mt-4 mb-24 flex items-center justify-between rounded-2xl bg-[#F4F6EE] p-3.5">
          <div className="flex items-center gap-3">
            <div className="border-r border-gray-300 pr-3">
              <Headphones className="size-5 text-[#14532D]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#14532D]">Need Help?</p>
              <p className="text-xs text-gray-600">Contact our support team</p>
            </div>
          </div>
          <Link href="/#contact" className="rounded-full border border-[#14532D] bg-white px-4 py-2 text-xs font-bold text-[#14532D]">
            Get Support
          </Link>
        </div>
      </Container>
    </section>
  );
}
