"use server";

import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
} from "@/lib/auth";
import { redirect } from "next/navigation";

type AuthSuccess = {
  success: true;
  hasDbCart: boolean;
  dbCartItemCount: number;
  redirectUrl: string;
};

type AuthError = {
  error: string;
};

type AuthResult = AuthSuccess | AuthError;

export async function register(formData: FormData): Promise<AuthResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name?.trim() || !email?.trim() || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const hashed = await hashPassword(password);

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
    },
  });

  await createSession({ userId: user.id, role: user.role });

  return {
    success: true,
    hasDbCart: false,
    dbCartItemCount: 0,
    redirectUrl: "/",
  };
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = formData.get("callbackUrl") as string;

  if (!email?.trim() || !password) {
    return { error: "Email and password are required" };
  }

  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !user.password) {
    return { error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  await createSession({ userId: user.id, role: user.role });

  const cartCount = await db.cartItem.count({
    where: { userId: user.id },
  });

  const redirectUrl =
    user.role === "ADMIN"
      ? "/dashboard"
      : callbackUrl?.startsWith("/")
        ? callbackUrl
        : "/";

  return {
    success: true,
    hasDbCart: cartCount > 0,
    dbCartItemCount: cartCount,
    redirectUrl,
  };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
