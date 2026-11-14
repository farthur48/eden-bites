import "server-only";

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin-email";
import { getNotificationRetrySecret } from "@/lib/env.server";
import { dispatchPendingNotifications } from "@/lib/notifications/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const secret = getNotificationRetrySecret();
  const headerSecret = request.headers.get("x-notification-secret");

  let authorized = false;
  if (secret && headerSecret) {
    const a = Buffer.from(secret);
    const b = Buffer.from(headerSecret);
    authorized = a.length === b.length && timingSafeEqual(a, b);
  }

  if (!authorized) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      authorized = isAdminEmail(data.user?.email);
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "10")));
  const result = await dispatchPendingNotifications({ limit });
  return NextResponse.json({ ok: true, ...result });
}
