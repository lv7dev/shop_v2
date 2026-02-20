import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/login?error=Invalid+OAuth+state", appUrl),
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+get+token", appUrl),
      );
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+get+user+info", appUrl),
      );
    }

    const googleUser = await userRes.json();

    const result = await handleOAuthCallback({
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.picture,
      provider: "GOOGLE",
    });

    // Clear oauth state cookie
    const response = NextResponse.redirect(new URL(result.redirectUrl, appUrl));
    response.cookies.delete("oauth_state");
    return response;
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=OAuth+failed", appUrl),
    );
  }
}
