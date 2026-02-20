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
    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri: `${appUrl}/api/auth/facebook/callback`,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`,
    );

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+get+token", appUrl),
      );
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${tokens.access_token}`,
    );

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+get+user+info", appUrl),
      );
    }

    const fbUser = await userRes.json();

    if (!fbUser.email) {
      return NextResponse.redirect(
        new URL("/login?error=Email+not+provided+by+Facebook", appUrl),
      );
    }

    const result = await handleOAuthCallback({
      email: fbUser.email,
      name: fbUser.name,
      image: fbUser.picture?.data?.url,
      provider: "FACEBOOK",
    });

    const response = NextResponse.redirect(new URL(result.redirectUrl, appUrl));
    response.cookies.delete("oauth_state");
    return response;
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=OAuth+failed", appUrl),
    );
  }
}
