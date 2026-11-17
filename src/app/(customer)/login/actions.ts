"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CustomerAuthState = {
  status: "idle" | "error";
  message?: string;
};

function safeNext(next: string | null | undefined): string {
  if (!next) return "/account";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export async function customerSignUpAction(
  _prev: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!name || !email || !password) {
    return { status: "error", message: "Enter your name, email, and password." };
  }
  if (password.length < 6) {
    return { status: "error", message: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) {
    return { status: "error", message: error.message || "Unable to create account." };
  }

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { status: "error", message: "Account created. Please sign in." };
    }
  }

  redirect(next);
}

export async function customerLoginAction(
  _prev: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: "Invalid email or password." };
  }

  redirect(next);
}

export async function customerLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => undefined);
  redirect("/login");
}
