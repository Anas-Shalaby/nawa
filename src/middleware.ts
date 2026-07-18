import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "./utils/supabase/config";

const intlMiddleware = createIntlMiddleware(routing);

const DASHBOARD_ROUTE = /^\/(ar|en)\/dashboard(?:\/|$)/;
const LOCALE_ROUTE = /^\/(ar|en)(?:\/|$)/;
/** Marketing home + auth pages — send signed-in clinics straight to the app. */
const AUTHED_MARKETING_ROUTE =
  /^\/(ar|en)(?:\/(?:login|register)(?:\/|$)|\/?$)/;

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function copyCookies(from: NextResponse, to: NextResponse): void {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response: NextResponse;
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/ar";
    response = NextResponse.redirect(url);
  } else if (pathname.startsWith("/super-admin")) {
    response = NextResponse.next({ request });
  } else {
    response = intlMiddleware(request);
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() validates the access token with Supabase Auth and refreshes
  // expired sessions through the cookie adapter above. Never trust getSession()
  // alone for a protected route.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const locale = pathname.match(LOCALE_ROUTE)?.[1] ?? routing.defaultLocale;
  const tenantId =
    typeof user?.app_metadata?.tenant_id === "string"
      ? user.app_metadata.tenant_id
      : null;
  const isClinicSession = Boolean(user && !authError && tenantId);

  if (isClinicSession && AUTHED_MARKETING_ROUTE.test(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = `/${locale}/dashboard`;
    dashboardUrl.search = "";
    const redirect = NextResponse.redirect(dashboardUrl);
    copyCookies(response, redirect);
    return addSecurityHeaders(redirect);
  }

  if (DASHBOARD_ROUTE.test(pathname)) {
    if (authError || !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      loginUrl.search = "";

      const redirect = NextResponse.redirect(loginUrl);
      copyCookies(response, redirect);
      return addSecurityHeaders(redirect);
    }

    if (!tenantId) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      loginUrl.search = "";
      loginUrl.searchParams.set("error", "missing_tenant");

      const redirect = NextResponse.redirect(loginUrl);
      copyCookies(response, redirect);
      return addSecurityHeaders(redirect);
    }
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/super-admin/:path*"],
};
