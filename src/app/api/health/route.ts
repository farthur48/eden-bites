import { NextResponse } from "next/server";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = hasPublicEnv();

  let database: "unconfigured" | "reachable" | "unreachable" = "unconfigured";

  if (configured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("store_settings")
        .select("id")
        .eq("id", "main")
        .maybeSingle();

      database = error ? "unreachable" : "reachable";
    } catch {
      database = "unreachable";
    }
  }

  const healthy = configured && database === "reachable";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      services: {
        supabaseEnv: configured ? "configured" : "missing",
        database,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
