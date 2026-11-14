"use server";

import { redirect } from "next/navigation";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  if (hasPublicEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut().catch(() => undefined);
  }

  redirect("/admin/login");
}
