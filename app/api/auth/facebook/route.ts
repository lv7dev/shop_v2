import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.FACEBOOK_APP_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=OAuth+not+configured", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    );
  }

  const state = crypto.randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/facebook/callback`,
    response_type: "code",
    scope: "email,public_profile",
    state,
  });

  const response = NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`,
  );

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
