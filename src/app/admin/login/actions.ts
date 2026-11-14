"use server";

import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/auth/admin-email";
import type { LoginState } from "@/lib/auth/types";
import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!hasPublicEnv()) {
    return {
      status: "error",
      message: "Admin sign-in is not configured yet.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedPath = String(formData.get("next") ?? "");

  if (!email || !password) {
    return {
      status: "error",
      message: "Enter your email address and password.",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { status: "error", message: "Invalid email or password." };
    }
  } catch {
    return {
      status: "error",
      message: "Unable to reach the authentication service. Please try again.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({
    data: { user: null },
    error: null,
  }));

  if (!isAdminEmail(user?.email)) {
    await supabase.auth.signOut().catch(() => undefined);

    return {
      status: "error",
      message: "This account is not authorized for the admin dashboard.",
    };
  }

  const nextPath =
    requestedPath.startsWith("/admin") &&
    !requestedPath.startsWith("/admin/login")
      ? requestedPath
      : "/admin";

  redirect(nextPath);
}
