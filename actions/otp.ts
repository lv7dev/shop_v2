"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { createUserAndSession } from "@/actions/auth";
import type { AuthSuccess, AuthError } from "@/actions/auth";
import type { CartDbItemInput } from "@/types/cart";
import { SignJWT, jwtVerify } from "jose";
import * as Sentry from "@sentry/nextjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production",
);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────
// Registration OTP
// ─────────────────────────────────────────────

export async function sendRegistrationOtp(
  email: string,
  name: string,
  password: string,
): Promise<{ success: true } | AuthError> {
  if (!name?.trim() || !email?.trim() || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.authProvider !== "EMAIL") {
        const provider =
          existing.authProvider === "GOOGLE" ? "Google" : "Facebook";
        return {
          error: `This email is linked to ${provider}. Please sign in with ${provider}.`,
        };
      }
      return { error: "Email already registered" };
    }

    const otp = generateOtp();
    const hashedOtp = await hashPassword(otp);

    // Delete any existing OTP for this email + type
    await db.otpVerification.deleteMany({
      where: { email: normalizedEmail, type: "REGISTRATION" },
    });

    await db.otpVerification.create({
      data: {
        email: normalizedEmail,
        otp: hashedOtp,
        type: "REGISTRATION",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    await sendOtpEmail(normalizedEmail, otp, "registration");

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("sendRegistrationOtp error:", error);
    return { error: "Failed to send verification code. Please try again." };
  }
}

export async function verifyRegistrationOtp(
  email: string,
  otp: string,
  name: string,
  password: string,
  localCartItems?: CartDbItemInput[],
): Promise<AuthSuccess | AuthError> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const record = await db.otpVerification.findFirst({
      where: { email: normalizedEmail, type: "REGISTRATION" },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return { error: "No verification code found. Please request a new one." };
    }

    if (record.expiresAt < new Date()) {
      await db.otpVerification.delete({ where: { id: record.id } });
      return { error: "Code expired. Please request a new one." };
    }

    if (record.attempts >= 5) {
      await db.otpVerification.delete({ where: { id: record.id } });
      return { error: "Too many attempts. Please request a new code." };
    }

    const isValid = await verifyPassword(otp, record.otp);

    if (!isValid) {
      await db.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return { error: "Invalid code. Please try again." };
    }

    // OTP verified — delete the record and create user
    await db.otpVerification.delete({ where: { id: record.id } });

    // Double-check email is still available (race condition guard)
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return { error: "Email already registered" };
    }

    const hashedPassword = await hashPassword(password);
    return await createUserAndSession(
      name,
      normalizedEmail,
      hashedPassword,
      localCartItems,
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error("verifyRegistrationOtp error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─────────────────────────────────────────────
// Password Reset OTP
// ─────────────────────────────────────────────

export async function sendPasswordResetOtp(
  email: string,
): Promise<{ success: true } | AuthError> {
  if (!email?.trim()) {
    return { error: "Email is required" };
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to avoid revealing whether email exists
    if (!user) {
      return { success: true };
    }

    if (user.authProvider !== "EMAIL") {
      const provider =
        user.authProvider === "GOOGLE" ? "Google" : "Facebook";
      return {
        error: `This email is linked to ${provider}. Please sign in with ${provider}.`,
      };
    }

    const otp = generateOtp();
    const hashedOtp = await hashPassword(otp);

    await db.otpVerification.deleteMany({
      where: { email: normalizedEmail, type: "PASSWORD_RESET" },
    });

    await db.otpVerification.create({
      data: {
        email: normalizedEmail,
        otp: hashedOtp,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOtpEmail(normalizedEmail, otp, "password_reset");

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("sendPasswordResetOtp error:", error);
    return { error: "Failed to send verification code. Please try again." };
  }
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string,
): Promise<{ success: true; resetToken: string } | AuthError> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const record = await db.otpVerification.findFirst({
      where: { email: normalizedEmail, type: "PASSWORD_RESET" },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return { error: "No verification code found. Please request a new one." };
    }

    if (record.expiresAt < new Date()) {
      await db.otpVerification.delete({ where: { id: record.id } });
      return { error: "Code expired. Please request a new one." };
    }

    if (record.attempts >= 5) {
      await db.otpVerification.delete({ where: { id: record.id } });
      return { error: "Too many attempts. Please request a new code." };
    }

    const isValid = await verifyPassword(otp, record.otp);

    if (!isValid) {
      await db.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return { error: "Invalid code. Please try again." };
    }

    // OTP verified — delete record and issue a short-lived JWT
    await db.otpVerification.delete({ where: { id: record.id } });

    const resetToken = await new SignJWT({
      email: normalizedEmail,
      purpose: "password_reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(JWT_SECRET);

    return { success: true, resetToken };
  } catch (error) {
    Sentry.captureException(error);
    console.error("verifyPasswordResetOtp error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function resetPassword(
  resetToken: string,
  newPassword: string,
): Promise<{ success: true } | AuthError> {
  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const { payload } = await jwtVerify(resetToken, JWT_SECRET);

    if (payload.purpose !== "password_reset" || !payload.email) {
      return { error: "Invalid reset token. Please start over." };
    }

    const email = payload.email as string;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "User not found." };
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Clean up any remaining OTP records for this email
    await db.otpVerification.deleteMany({
      where: { email, type: "PASSWORD_RESET" },
    });

    return { success: true };
  } catch (error) {
    // JWT verification errors (expired, malformed)
    if (error instanceof Error && error.message.includes("JW")) {
      return { error: "Session expired. Please start over." };
    }

    Sentry.captureException(error);
    console.error("resetPassword error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
