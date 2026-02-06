import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-edge";

const PUBLIC_PATHS = ["/", "/products", "/categories", "/cart", "/login", "/register", "/forgot-password"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/products/")) return true;
  if (pathname.startsWith("/categories/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.includes(".")) return true; // static files
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
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

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
