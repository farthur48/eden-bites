import "server-only";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/types/database";

export type StoreResult =
  | { status: "ready"; store: StoreSettings | null }
  | { status: "setup"; store: null }
  | { status: "error"; store: null };

export async function getStoreSettings(): Promise<StoreResult> {
  if (!hasPublicEnv()) {
    return { status: "setup", store: null };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (error) {
      return { status: "error", store: null };
    }

    return { status: "ready", store: data };
  } catch {
    return { status: "error", store: null };
  }
}
