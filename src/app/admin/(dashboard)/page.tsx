import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, ShoppingBag, TrendingUp, ArrowRight, Store, Banknote } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { formatDateTime, formatGhs, formatOrderStatus } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import { toggleStoreAvailabilityAction } from "@/app/admin/(dashboard)/settings/actions";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function statusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "new":
      return "warning";
    case "out_for_delivery":
      return "lime";
    default:
      return "default";
  }
}

const statCards = [
  { key: "today", label: "Orders Today", icon: ShoppingBag },
  { key: "new", label: "New Orders", icon: Clock3 },
  { key: "preparing", label: "Preparing", icon: TrendingUp },
  { key: "out_for_delivery", label: "Out for delivery", icon: TrendingUp },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const params = await searchParams;
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">Welcome back. Here&apos;s what&apos;s happening with Eden Bites today.</p>
        </div>
        <Link href="/admin/orders?status=new" className={buttonStyles({ variant: "accent", size: "sm" })}>
          View new orders
        </Link>
      </div>

      {summary.status === "setup" ? (
        <EmptyState
          eyebrow="Setup"
          title="Connect your Supabase project"
          description="Add Supabase credentials to .env.local and restart the app to load live data."
        />
      ) : null}

      {summary.status === "error" ? (
        <EmptyState
          eyebrow="Database"
          title="Dashboard data unavailable"
          description="Check your Supabase connection and migrations, then reload this page."
        />
      ) : null}

      {params.store === "open" || params.store === "closed" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Store ordering is now {params.store === "open" ? "open" : "closed"}.
        </p>
      ) : params.store === "error" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          Could not update store availability.
        </p>
      ) : null}

      {summary.status === "ready" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Store Availability</p>
                  <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-brand-green-deep">
                    {summary.store?.is_open ? "Open" : "Closed"}
                  </p>
                  <p className="mt-1 text-xs text-muted">{summary.store?.opening_note || "Controls whether customers can place orders."}</p>
                </div>
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-cream text-brand-green-deep"><Store className="size-5" strokeWidth={1.8} /></span>
              </div>
              <form action={toggleStoreAvailabilityAction} className="mt-4 flex flex-wrap items-center gap-2">
                <input type="hidden" name="isOpen" value={summary.store?.is_open ? "false" : "true"} />
                <button type="submit" className={buttonStyles({ variant: summary.store?.is_open ? "outline" : "accent", size: "sm" })}>
                  {summary.store?.is_open ? "Switch OFF (close orders)" : "Switch ON (open orders)"}
                </button>
                <Link href="/admin/settings" className="text-sm font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4">Settings</Link>
              </form>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Today&apos;s Confirmed Sales</p>
                  <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-brand-green-deep">
                    {formatGhs(summary.stats.todayConfirmedSalesPesewas)}
                  </p>
                  <p className="mt-1 text-xs text-muted">Completed orders with confirmed payments today only.</p>
                </div>
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-cream text-brand-green-deep"><Banknote className="size-5" strokeWidth={1.8} /></span>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Pending Delivery Fees</p>
                  <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-brand-green-deep">
                    {summary.stats.pendingDeliveryFees}
                  </p>
                  <p className="mt-1 text-xs text-muted">Delivery orders waiting for fee confirmation.</p>
                </div>
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-cream text-brand-green-deep"><Clock3 className="size-5" strokeWidth={1.8} /></span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              const value =
                card.key === "today"
                  ? summary.stats.todayOrders
                  : card.key === "new"
                    ? summary.stats.newOrders
                    : card.key === "preparing"
                      ? summary.stats.preparing
                      : card.key === "out_for_delivery"
                        ? summary.stats.outForDelivery
                        : summary.stats.completed;
              return (
                <div key={card.key} className="rounded-[1.25rem] border border-border/70 bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted">{card.label}</p>
                      <p className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] text-brand-green-deep">
                        {value}
                      </p>
                    </div>
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-cream text-brand-green-deep">
                      <Icon className="size-5" strokeWidth={1.8} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-display text-xl font-bold text-brand-green-deep">Recent orders</h2>
                <p className="mt-0.5 text-xs text-muted">Latest orders across delivery and pickup.</p>
              </div>
              <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-deep hover:underline">
                View all <ArrowRight className="size-4" />
              </Link>
            </div>

            {summary.recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted">No orders yet.</div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-brand-cream/50 text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Order ID</th>
                        <th className="px-6 py-3 font-semibold">Customer</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Fulfilment</th>
                        <th className="px-6 py-3 font-semibold">Amount</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {summary.recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-brand-cream/20">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-green-deep">{order.reference}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{order.customer_name}</td>
                          <td className="px-6 py-4 text-xs text-muted">{formatDateTime(order.created_at)}</td>
                          <td className="px-6 py-4 capitalize text-muted">{order.fulfilment_method}</td>
                          <td className="px-6 py-4 font-semibold text-brand-green-deep">{formatGhs(order.total_pesewas)}</td>
                          <td className="px-6 py-4">
                            <Badge variant={statusVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-border/70 md:hidden">
                  {summary.recentOrders.map((order) => (
                    <li key={order.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-semibold text-brand-green-deep">{order.reference}</p>
                          <p className="mt-1 font-semibold text-foreground">{order.customer_name}</p>
                          <p className="mt-0.5 text-xs text-muted capitalize">{order.fulfilment_method} · {formatDateTime(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-brand-green-deep">{formatGhs(order.total_pesewas)}</p>
                          <Badge variant={statusVariant(order.status)} className="mt-2">{formatOrderStatus(order.status)}</Badge>
                        </div>
                      </div>
                      <Link href={`/admin/orders/${order.id}`} className="mt-3 inline-flex text-sm font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4">View details</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
