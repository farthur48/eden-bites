import "server-only";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderStatus } from "@/types/database";

export type AdminOrderListItem = Pick<
  Order,
  | "id"
  | "reference"
  | "customer_name"
  | "customer_phone"
  | "status"
  | "fulfilment_method"
  | "delivery_fee_status"
  | "delivery_fee_pesewas"
  | "subtotal_pesewas"
  | "total_pesewas"
  | "created_at"
>;

export type AdminOrderDetail = {
  order: Order;
  items: OrderItem[];
};

export type OrderStats = {
  status: "ready" | "setup" | "error";
  total: number;
  newOrders: number;
  preparing: number;
  completed: number;
  cancelled: number;
  pendingDeliveryFees: number;
};

const emptyStats: OrderStats = {
  status: "setup",
  total: 0,
  newOrders: 0,
  preparing: 0,
  completed: 0,
  cancelled: 0,
  pendingDeliveryFees: 0,
};

export async function getOrderStats(): Promise<OrderStats> {
  if (!hasPublicEnv()) {
    return emptyStats;
  }

  try {
    const supabase = await createClient();
    const [ordersResult, feesResult] = await Promise.all([
      supabase.from("orders").select("status"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("fulfilment_method", "delivery")
        .eq("delivery_fee_status", "pending")
        .in("status", ["new", "preparing"]),
    ]);

    if (ordersResult.error || feesResult.error) {
      return { ...emptyStats, status: "error" };
    }

    const counts: Record<OrderStatus, number> = {
      new: 0,
      preparing: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const row of ordersResult.data ?? []) {
      counts[row.status] += 1;
    }

    return {
      status: "ready",
      total: (ordersResult.data ?? []).length,
      newOrders: counts.new,
      preparing: counts.preparing,
      completed: counts.completed,
      cancelled: counts.cancelled,
      pendingDeliveryFees: feesResult.count ?? 0,
    };
  } catch {
    return { ...emptyStats, status: "error" };
  }
}

export async function getNewOrderCount(): Promise<number> {
  if (!hasPublicEnv()) {
    return 0;
  }

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

export async function getRecentOrders(
  limit = 5,
): Promise<{ status: "ready" | "setup" | "error"; orders: AdminOrderListItem[] }> {
  if (!hasPublicEnv()) {
    return { status: "setup", orders: [] };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, reference, customer_name, customer_phone, status, fulfilment_method, delivery_fee_status, delivery_fee_pesewas, subtotal_pesewas, total_pesewas, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { status: "error", orders: [] };
    }

    return { status: "ready", orders: data ?? [] };
  } catch {
    return { status: "error", orders: [] };
  }
}

export async function getOrders({
  status,
  query,
}: {
  status?: OrderStatus | "all";
  query?: string;
}): Promise<{
  status: "ready" | "setup" | "error";
  orders: AdminOrderListItem[];
}> {
  if (!hasPublicEnv()) {
    return { status: "setup", orders: [] };
  }

  try {
    const supabase = await createClient();
    let builder = supabase
      .from("orders")
      .select(
        "id, reference, customer_name, customer_phone, status, fulfilment_method, delivery_fee_status, delivery_fee_pesewas, subtotal_pesewas, total_pesewas, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (status && status !== "all") {
      builder = builder.eq("status", status);
    }

    const term = query?.trim().slice(0, 80).replace(/[,()%]/g, " ");

    if (term) {
      builder = builder.or(
        `reference.ilike.%${term}%,customer_name.ilike.%${term}%`,
      );
    }

    const { data, error } = await builder;

    if (error) {
      return { status: "error", orders: [] };
    }

    return { status: "ready", orders: data ?? [] };
  } catch {
    return { status: "error", orders: [] };
  }
}

export async function getOrderDetail(
  id: string,
): Promise<AdminOrderDetail | null> {
  if (!hasPublicEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !order) {
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      return null;
    }

    return { order, items: items ?? [] };
  } catch {
    return null;
  }
}
