import "server-only";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getOrderStats, getRecentOrders, type AdminOrderListItem, type OrderStats } from "@/lib/data/orders";
import type { StoreSettings } from "@/types/database";

export type DashboardSummary = {
  status: "ready" | "setup" | "error";
  store: StoreSettings | null;
  activeProducts: number;
  stats: OrderStats;
  recentOrders: AdminOrderListItem[];
  isDbAdmin: boolean;
};

const emptySummary: DashboardSummary = {
  status: "setup",
  store: null,
  activeProducts: 0,
  stats: {
    status: "setup",
    total: 0,
    newOrders: 0,
    preparing: 0,
    outForDelivery: 0,
    completed: 0,
    cancelled: 0,
    pendingDeliveryFees: 0,
    todayOrders: 0,
    todayConfirmedSalesPesewas: 0,
  },
  recentOrders: [],
  isDbAdmin: false,
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!hasPublicEnv()) {
    return emptySummary;
  }

  try {
    const supabase = await createClient();
    const [storeResult, productsResult, stats, recentOrders] = await Promise.all([
      supabase.from("store_settings").select("*").eq("id", "main").maybeSingle(),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      getOrderStats(),
      getRecentOrders(5),
    ]);

    if (storeResult.error || productsResult.error) {
      return { ...emptySummary, status: "error" };
    }

    let isDbAdmin = false;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      isDbAdmin = profile?.is_admin ?? false;
    }

    return {
      status: stats.status === "error" ? "error" : "ready",
      store: storeResult.data,
      activeProducts: productsResult.count ?? 0,
      stats,
      recentOrders: recentOrders.orders,
      isDbAdmin,
    };
  } catch {
    return { ...emptySummary, status: "error" };
  }
}
