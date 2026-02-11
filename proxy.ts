import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-edge";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];
const PUBLIC_PATHS = ["/", "/products", "/categories", "/cart", ...AUTH_PATHS];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/products/")) return true;
  if (pathname.startsWith("/categories/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.includes(".")) return true; // static files
  return false;
}

function isAuthPage(pathname: string) {
  return AUTH_PATHS.includes(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  // For auth pages, check if user is already logged in and redirect away
  if (isAuthPage(pathname)) {
    const session = token ? await verifyToken(token) : null;
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Public paths don't require auth
  if (isPublic(pathname)) {
    return NextResponse.next();
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
  if (pathname.startsWith("/dashboard") && session.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
