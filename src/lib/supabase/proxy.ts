import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/auth/admin-email";
import { getPublicEnv } from "@/lib/env";

const ADMIN_LOGIN_PATH = "/admin/login";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function redirectWithCookies(
  url: URL,
  response: NextResponse,
): NextResponse {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateAdminSession(
  request: NextRequest,
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (!isAdminPath(pathname)) {
    return NextResponse.next({ request });
  }

  const env = getPublicEnv();

  if (!env) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return NextResponse.next({ request });
    }

    const url = request.nextUrl.clone();
    url.pathname = ADMIN_LOGIN_PATH;
    url.search = "?error=not_configured";

    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({
    data: { user: null as User | null },
    error: null,
  }));

  if (!user) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = ADMIN_LOGIN_PATH;
    url.search = "";
    url.searchParams.set("next", pathname);

    return redirectWithCookies(url, response);
  }

  if (!isAdminEmail(user.email)) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = ADMIN_LOGIN_PATH;
    url.search = "";
    url.searchParams.set("error", "unauthorized");

    return redirectWithCookies(url, response);
  }

  if (pathname === ADMIN_LOGIN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";

    return redirectWithCookies(url, response);
  }

  return response;
}
