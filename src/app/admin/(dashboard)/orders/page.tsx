import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrderStats, getOrders } from "@/lib/data/orders";
import { formatDateTime, formatGhs, formatOrderStatus } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

const filters: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "preparing", label: "Preparing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function statusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "new":
      return "warning";
    default:
      return "default";
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; fees?: string }>;
}) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const query = (params.q ?? "").trim();
  const pendingFeesOnly = params.fees === "pending";

  const [result, stats] = await Promise.all([
    getOrders({ status, query }),
    getOrderStats(),
  ]);

  const orders = pendingFeesOnly
    ? result.orders.filter(
        (order) =>
          order.fulfilment_method === "delivery" &&
          order.delivery_fee_status === "pending" &&
          (order.status === "new" || order.status === "preparing"),
      )
    : result.orders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep">
            Orders
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review, confirm, and manage customer orders.
          </p>
        </div>
      </div>

      <form
        action="/admin/orders"
        method="get"
        className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-white p-4 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="status" value={status} />
        <label className="relative flex-1">
          <span className="sr-only">Search orders</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by order ID or customer name"
            className="h-11 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10"
          />
        </label>
        <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = !pendingFeesOnly && status === filter.value;
          const count =
            filter.value === "new"
              ? stats.newOrders
              : filter.value === "preparing"
                ? stats.preparing
                : filter.value === "completed"
                  ? stats.completed
                  : filter.value === "cancelled"
                    ? stats.cancelled
                    : null;
          return (
            <Link
              key={filter.value}
              href={buildHref(filter.value, query)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-green-deep text-white"
                  : "border border-border/70 bg-white text-muted hover:text-brand-green-deep",
              )}
            >
              {filter.label}
              {count !== null ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold",
                    active ? "bg-brand-lime text-brand-black" : "bg-brand-cream text-brand-green-deep",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {result.status === "setup" || result.status === "error" ? (
        <EmptyState
          eyebrow="Orders"
          title="Orders unavailable"
          description="Connect Supabase and apply migrations to manage orders."
        />
      ) : null}

      {result.status === "ready" && orders.length === 0 ? (
        <EmptyState
          eyebrow="Orders"
          title={query ? "No matching orders" : "No orders yet"}
          description={
            query
              ? `Nothing matched "${query}". Try a different search.`
              : "New customer orders will appear here."
          }
        />
      ) : null}

      {result.status === "ready" && orders.length > 0 ? (
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-brand-cream/50 text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Order ID</th>
                  <th className="px-6 py-3.5 font-semibold">Customer</th>
                  <th className="px-6 py-3.5 font-semibold">Date</th>
                  <th className="px-6 py-3.5 font-semibold">Fulfilment</th>
                  <th className="px-6 py-3.5 font-semibold">Amount</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-brand-cream/20">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-green-deep">
                      {order.reference}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{order.customer_name}</p>
                      <p className="text-xs text-muted">{order.customer_phone}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted">{formatDateTime(order.created_at)}</td>
                    <td className="px-6 py-4 capitalize text-muted">{order.fulfilment_method}</td>
                    <td className="px-6 py-4 font-semibold text-brand-green-deep">{formatGhs(order.total_pesewas)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border/70 md:hidden">
            {orders.map((order) => (
              <li key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-brand-green-deep">{order.reference}</p>
                    <p className="mt-1 font-semibold text-foreground">{order.customer_name}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted">{order.fulfilment_method} · {formatDateTime(order.created_at)}</p>
                  </div>
                  <Badge variant={statusVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-semibold text-brand-green-deep">{formatGhs(order.total_pesewas)}</p>
                  <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4">
                    View details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function parseStatus(value: string | undefined): OrderStatus | "all" {
  return value === "new" || value === "preparing" || value === "completed" || value === "cancelled"
    ? value
    : "all";
}

function buildHref(status: OrderStatus | "all", query: string): string {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/admin/orders?${search}` : "/admin/orders";
}
