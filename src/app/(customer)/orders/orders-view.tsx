"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Headphones,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";

type OrderStatus = "confirmed" | "out_for_delivery" | "delivered";
type Filter = "all" | "in_progress" | "completed";

type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  item: { name: string; details: string; price: string; image: string };
};

const orders: Order[] = [
  {
    id: "#EB20261117",
    date: "Nov 17, 2026 • 9:41 AM",
    status: "confirmed",
    item: {
      name: "Jollof Rice Combo",
      details: "Regular Size • Extra Chicken",
      price: "GH₵ 70",
      image: "/menu/banku-tilapia.jpg",
    },
  },
  {
    id: "#EB20261116",
    date: "Nov 16, 2026 • 6:20 PM",
    status: "out_for_delivery",
    item: {
      name: "Fried Rice",
      details: "Large Size",
      price: "GH₵ 75",
      image: "/menu/acheke-tilapia.jpg",
    },
  },
  {
    id: "#EB20261115",
    date: "Nov 15, 2026 • 1:05 PM",
    status: "delivered",
    item: {
      name: "Banku & Tilapia",
      details: "Regular Size",
      price: "GH₵ 65",
      image: "/menu/banku-tilapia.jpg",
    },
  },
];

function matchesFilter(status: OrderStatus, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "in_progress") return status === "confirmed" || status === "out_for_delivery";
  return status === "delivered";
}

function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5D6] px-3 py-1 text-xs font-bold text-[#14532D]">
        <span className="h-2 w-2 rounded-full bg-[#14532D]" aria-hidden="true" /> Confirmed
      </span>
    );
  }
  if (status === "out_for_delivery") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5D6] px-3 py-1 text-xs font-bold text-[#14532D]">
        <Truck className="size-3.5" aria-hidden="true" /> Out for Delivery
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
      <Check className="size-3.5" aria-hidden="true" /> Delivered
    </span>
  );
}

export function OrdersView() {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(() => orders.filter((o) => matchesFilter(o.status, filter)), [filter]);

  const tabs: { key: Filter; label: string; icon: typeof Clock }[] = [
    { key: "all", label: "All Orders", icon: Clock },
    { key: "in_progress", label: "In Progress", icon: Truck },
    { key: "completed", label: "Completed", icon: Check },
  ];

  return (
    <div className="pb-2">
      <h1 className="mt-2 text-3xl font-extrabold text-[#14532D]">My Orders</h1>
      <p className="mt-1 text-sm text-gray-600">Track and manage your orders</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-semibold",
                active
                  ? "bg-[#14532D] text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-800",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="whitespace-nowrap">{tab.label}</span>
              {active ? (
                <span className="absolute -bottom-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#A3E635]" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-4">
        {filtered.map((order) => (
          <article key={order.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <p className="text-base font-extrabold text-gray-900">{order.id}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Calendar className="size-3.5" aria-hidden="true" /> {order.date}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-3.5 py-3.5">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-brand-sand">
                <Image src={order.item.image} alt={order.item.name} fill sizes="4rem" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{order.item.name}</p>
                <p className="text-xs text-gray-500">{order.item.details}</p>
                <p className="mt-1 text-sm font-extrabold text-[#15803D]">{order.item.price}</p>
              </div>
              <Link
                href="/order-confirmation"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#14532D] px-4 py-2 text-xs font-bold text-[#14532D] hover:bg-[#F4F6EE]"
              >
                View Details <ChevronRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mb-24 mt-4 flex items-center justify-between rounded-2xl bg-[#F4F6EE] p-3.5">
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
    </div>
  );
}
