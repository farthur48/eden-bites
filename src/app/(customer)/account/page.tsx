import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  CreditCard,
  Headphones,
  Heart,
  Info,
  LogOut,
  MapPin,
  Pencil,
  User,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { getCurrentUser } from "@/lib/auth";
import { customerLogoutAction } from "@/app/(customer)/login/actions";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Eden Bites account and profile.",
};

const menuItems = [
  { icon: ClipboardList, title: "My Orders", subtitle: "View your order history", href: "/orders" },
  { icon: MapPin, title: "Delivery Addresses", subtitle: "Manage your addresses", href: "/account" },
  { icon: CreditCard, title: "Payment Preferences", subtitle: "Set your preferred payment method", href: "/account" },
  { icon: Heart, title: "Favourite Meals", subtitle: "Save your favourite meals", href: "/account" },
  { icon: Headphones, title: "Help & Support", subtitle: "Get help or contact us", href: "/#contact" },
  { icon: Info, title: "About Eden Bites", subtitle: "Learn more about us", href: "/" },
];

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const displayName = meta.full_name || meta.name || user.email?.split("@")[0] || "Customer";
  const email = user.email ?? "";

  return (
    <section className="relative overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-[#F2F8E4]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-20 h-48 w-48 rounded-[45%] bg-[#F2F8E4]" />
      <Container className="relative px-4 pb-4 pt-2 sm:px-6">
        <div className="mt-3 flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#14532D]">
              <User className="size-8 text-white" aria-hidden="true" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#A3E635]">
              <Pencil className="size-3 text-[#14532D]" aria-hidden="true" />
            </span>
          </div>
          <div className="ml-3.5 min-w-0 flex-1">
            <p className="text-lg font-extrabold text-gray-900">{displayName}</p>
            <p className="mt-0.5 text-xs text-gray-600">{email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-[#EBF5D6] px-3 py-0.5 text-[11px] font-bold text-[#14532D]">
              Customer
            </span>
          </div>
          <ChevronRight className="size-5 flex-shrink-0 text-gray-700" aria-hidden="true" />
        </div>

        <div className="relative mt-3.5 flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-r from-[#14532D] to-[#1E5631] p-4">
          <div className="z-10 max-w-[55%]">
            <p className="text-xl font-extrabold leading-tight text-white whitespace-pre-line">{"Good Food,\nGood Mood"}</p>
            <p className="mt-1.5 text-xs leading-snug text-gray-200">Order again and enjoy our delicious meals.</p>
            <Link
              href="/menu"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#A3E635] px-4 py-2 text-xs font-bold text-[#14532D] hover:bg-[#93D325]"
            >
              Order Now <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative -mr-6 -my-2 h-28 w-36 flex-shrink-0">
            <span className="absolute left-0 top-1 flex flex-col gap-1" aria-hidden="true">
              <span className="block h-3 w-0.5 rotate-[-25deg] rounded-full bg-[#A3E635]" />
              <span className="ml-1 block h-4 w-0.5 rotate-[-10deg] rounded-full bg-[#A3E635]" />
              <span className="block h-3 w-0.5 rotate-[5deg] rounded-full bg-[#A3E635]" />
            </span>
            <Image
              src="/menu/banku-tilapia.jpg"
              alt="Delicious meal"
              fill
              sizes="9rem"
              className="rounded-l-full object-cover object-left"
            />
          </div>
        </div>

        <nav className="mt-3.5 space-y-2.5" aria-label="Account menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <Icon className="size-5 flex-shrink-0 text-[#14532D]" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </div>
                <ChevronRight className="size-5 flex-shrink-0 text-gray-700" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        <form action={customerLogoutAction}>
          <button
            type="submit"
            className="mb-24 mt-2.5 flex w-full items-center gap-3.5 rounded-2xl bg-[#F4F6EE] px-4 py-3 text-left"
          >
            <LogOut className="size-5 flex-shrink-0 text-[#14532D]" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Log Out</p>
              <p className="text-xs text-gray-600">Sign out of your account</p>
            </div>
            <ChevronRight className="size-5 flex-shrink-0 text-gray-700" aria-hidden="true" />
          </button>
        </form>
      </Container>
    </section>
  );
}
