import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { isAdminEmail } from "./auth/admin-email";
import { hasPublicEnv } from "./env";
import { createClient } from "./supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  if (!hasPublicEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<User> {
  if (!hasPublicEnv()) {
    redirect("/admin/login?error=not_configured");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/admin/login?error=unauthorized");
  }

  return user;
}
