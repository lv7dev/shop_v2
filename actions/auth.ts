"use server";

import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  getSession,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import type { CartDbItemInput } from "@/types/cart";
import type { EnrichedCartItem } from "@/actions/cart-db";

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

type CartMergeResult = {
  success: boolean;
  items: EnrichedCartItem[];
  redirectUrl: string;
  dbCartItemCount?: number;
  error?: string;
};

export async function register(
  formData: FormData,
  localCartItems?: CartDbItemInput[]
): Promise<AuthResult> {
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

  // Save local cart to DB in the same server action (avoids separate call after cookie set)
  if (localCartItems && localCartItems.length > 0) {
    await db.cartItem.createMany({
      data: localCartItems.map((item) => ({
        userId: user.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  }

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

export async function loginWithCart(
  formData: FormData,
  localCartItems: CartDbItemInput[]
): Promise<CartMergeResult | AuthError> {
  const loginResult = await login(formData);

  if ("error" in loginResult) {
    return loginResult;
  }

  const email = formData.get("email") as string;
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    return { error: "User not found" };
  }

  const hasLocalItems = localCartItems.length > 0;

  // Case 1: No local items + DB cart -> Load from DB
  // Case 2: No local items + no DB cart -> Return empty
  if (!hasLocalItems) {
    const items = await loadEnrichedCart(user.id);
    return {
      success: true,
      items,
      redirectUrl: loginResult.redirectUrl,
    };
  }

  // Case 3: Local items + no DB cart -> Save local to DB
  if (!loginResult.hasDbCart) {
    await db.cartItem.createMany({
      data: localCartItems.map((item) => ({
        userId: user.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    const items = await loadEnrichedCart(user.id);
    return {
      success: true,
      items,
      redirectUrl: loginResult.redirectUrl,
    };
  }

  // Case 4: Local items + DB cart -> Return conflict info for merge modal
  return {
    success: true,
    items: [],
    redirectUrl: loginResult.redirectUrl,
    dbCartItemCount: loginResult.dbCartItemCount,
    error: "MERGE_NEEDED",
  };
}

export async function resolveCartMerge(
  localCartItems: CartDbItemInput[],
  strategy: "merge" | "keep_db"
): Promise<{ success: boolean; items: EnrichedCartItem[] }> {
  const session = await getSession();
  if (!session) return { success: false, items: [] };

  const userId = session.userId;

  try {
    if (strategy === "merge") {
      const existingItems = await db.cartItem.findMany({
        where: { userId },
      });

      const mergedMap = new Map<string, number>();
      for (const item of existingItems) {
        mergedMap.set(item.productId, item.quantity);
      }
      for (const item of localCartItems) {
        const existing = mergedMap.get(item.productId) || 0;
        mergedMap.set(item.productId, existing + item.quantity);
      }

      const mergedData = Array.from(mergedMap.entries()).map(
        ([productId, quantity]) => ({
          userId,
          productId,
          quantity,
        })
      );

      if (mergedData.length > 0) {
        await db.$transaction([
          db.cartItem.deleteMany({ where: { userId } }),
          db.cartItem.createMany({ data: mergedData }),
        ]);
      }
    }
    // For "keep_db", we don't need to modify DB — just load existing

    const items = await loadEnrichedCart(userId);
    return { success: true, items };
  } catch (error) {
    console.error("resolveCartMerge error:", error);
    return { success: false, items: [] };
  }
}

async function loadEnrichedCart(userId: string): Promise<EnrichedCartItem[]> {
  const cartItems = await db.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          stock: true,
          isActive: true,
        },
      },
    },
  });

  return cartItems
    .filter((item) => item.product.isActive)
    .map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      image: item.product.images[0] ?? "",
      quantity: Math.min(item.quantity, item.product.stock),
      stock: item.product.stock,
    }));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
