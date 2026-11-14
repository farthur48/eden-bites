import "server-only";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";

export type MenuResult =
  | { status: "ready"; products: Product[] }
  | { status: "setup"; products: Product[] }
  | { status: "error"; products: Product[] };

export async function getActiveProducts(): Promise<MenuResult> {
  if (!hasPublicEnv()) {
    return { status: "setup", products: [] };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return { status: "error", products: [] };
    }

    return { status: "ready", products: data ?? [] };
  } catch {
    return { status: "error", products: [] };
  }
}
