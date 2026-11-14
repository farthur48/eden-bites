import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { requirePublicEnv } from "@/lib/env";
import { getServiceRoleKey } from "@/lib/env.server";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const env = requirePublicEnv();

  return createSupabaseClient<Database>(env.url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
