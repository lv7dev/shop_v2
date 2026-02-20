import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";
import type { AuthProvider } from "@/lib/generated/prisma";

type OAuthUserInfo = {
  email: string;
  name: string;
  image?: string;
  provider: "GOOGLE" | "FACEBOOK";
};

type OAuthResult = {
  redirectUrl: string;
};

/**
 * Shared OAuth callback handler for Google and Facebook.
 *
 * Rules:
 * - If email was registered manually (authProvider=EMAIL), block OAuth login
 *   and redirect with error.
 * - If email exists with same provider, log them in.
 * - If email exists with a different OAuth provider, block and redirect with error.
 * - If email is new, create account with the OAuth provider.
 */
export async function handleOAuthCallback(
  userInfo: OAuthUserInfo,
): Promise<OAuthResult> {
  const { email, name, image, provider } = userInfo;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Email registered with manual email/password — block OAuth
      if (existingUser.authProvider === "EMAIL") {
        return {
          redirectUrl: `/login?error=${encodeURIComponent(
            "This email is registered with a password. Please sign in with your email and password.",
          )}`,
        };
      }

      // Email registered with a different OAuth provider
      if (existingUser.authProvider !== provider) {
        const providerName = existingUser.authProvider === "GOOGLE" ? "Google" : "Facebook";
        return {
          redirectUrl: `/login?error=${encodeURIComponent(
            `This email is linked to ${providerName}. Please sign in with ${providerName}.`,
          )}`,
        };
      }

      // Same provider — log in
      await createSession({
        userId: existingUser.id,
        role: existingUser.role,
      });

      return {
        redirectUrl: existingUser.role === "ADMIN" ? "/dashboard" : "/",
      };
    }

    // New user — create account
    const newUser = await db.user.create({
      data: {
        email: normalizedEmail,
        name,
        image: image || null,
        authProvider: provider as AuthProvider,
        password: null,
      },
    });

    await createSession({ userId: newUser.id, role: newUser.role });

    return { redirectUrl: "/" };
  } catch (error) {
    Sentry.captureException(error);
    console.error("OAuth callback error:", error);
    return {
      redirectUrl: `/login?error=${encodeURIComponent("Something went wrong. Please try again.")}`,
    };
  }
}
