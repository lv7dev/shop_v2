import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { verifyToken } from "@/lib/auth-edge";

const intlMiddleware = createMiddleware(routing);

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];
const PUBLIC_PATHS = ["/", "/products", "/categories", "/cart", ...AUTH_PATHS];

/** Strip locale prefix from pathname for route matching */
function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

function isPublic(pathname: string) {
  const stripped = stripLocale(pathname);
  if (PUBLIC_PATHS.includes(stripped)) return true;
  if (stripped.startsWith("/products/")) return true;
  if (stripped.startsWith("/categories/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/monitoring")) return true; // Sentry tunnel route
  if (pathname.includes(".")) return true; // static files
  return false;
}

function isAuthPage(pathname: string) {
  return AUTH_PATHS.includes(stripLocale(pathname));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run next-intl middleware first (handles locale detection/redirect)
  const intlResponse = intlMiddleware(request);

  // If next-intl wants to redirect (e.g., adding locale prefix), let it
  if (intlResponse.headers.get("Location")) {
    return intlResponse;
  }

  const token = request.cookies.get("session")?.value;

  // For auth pages, check if user is already logged in and redirect away
  if (isAuthPage(pathname)) {
    const session = token ? await verifyToken(token) : null;
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return intlResponse;
  }

  // Public paths don't require auth
  if (isPublic(pathname)) {
    return intlResponse;
  }

  const session = token ? await verifyToken(token) : null;

  // Redirect unauthenticated users to login with return URL
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Protect admin routes
  const stripped = stripLocale(pathname);
  if (stripped.startsWith("/dashboard") && session.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|monitoring|api/).*)"],
};
