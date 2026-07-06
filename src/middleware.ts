import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/super-admin")) {
    const response = NextResponse.next();
    return updateSession(request, response);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/ar";
    const response = NextResponse.redirect(url);
    return updateSession(request, response);
  }

  const intlResponse = intlMiddleware(request);
  return updateSession(request, intlResponse);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/super-admin/:path*"],
};
