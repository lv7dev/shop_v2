"use server";

import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
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

  redirect("/");
}

export async function login(formData: FormData) {
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

  if (user.role === "ADMIN") {
    redirect("/dashboard");
  }

  // Only allow relative URLs to prevent open redirect attacks
  const safeCallback = callbackUrl?.startsWith("/") ? callbackUrl : "/";
  redirect(safeCallback);
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
