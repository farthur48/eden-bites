import { NextResponse } from "next/server";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let healthy = false;

  if (hasPublicEnv()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("store_settings")
        .select("id")
        .eq("id", "main")
        .maybeSingle();

      healthy = !error;
    } catch {
      healthy = false;
    }
  }

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded" },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
