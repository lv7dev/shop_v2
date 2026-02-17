"use server";

import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
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
  localCartItems?: CartDbItemInput[],
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

  try {
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
          variantId: item.variantId ?? null,
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
  } catch (error) {
    Sentry.captureException(error);
    console.error("Register error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = formData.get("callbackUrl") as string;

  if (!email?.trim() || !password) {
    return { error: "Email and password are required" };
  }

  try {
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
  } catch (error) {
    Sentry.captureException(error);
    console.error("Login error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function loginWithCart(
  formData: FormData,
  localCartItems: CartDbItemInput[],
): Promise<CartMergeResult | AuthError> {
  const loginResult = await login(formData);

  if ("error" in loginResult) {
    return loginResult;
  }

  try {
    const email = formData.get("email") as string;
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const hasLocalItems = localCartItems.length > 0;

    // Case 1: No local items -> Load from DB (or empty)
    if (!hasLocalItems) {
      const items = await loadEnrichedCart(user.id);
      return {
        success: true,
        items,
        redirectUrl: loginResult.redirectUrl,
      };
    }

    // Case 2: Local items + no DB cart -> Save local to DB
    if (!loginResult.hasDbCart) {
      await db.cartItem.createMany({
        data: localCartItems.map((item) => ({
          userId: user.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
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

    // Case 3: Local items + DB cart -> Conflict, show merge modal
    return {
      success: true,
      items: [],
      redirectUrl: loginResult.redirectUrl,
      dbCartItemCount: loginResult.dbCartItemCount,
      error: "MERGE_NEEDED",
    };
  } catch (error) {
    Sentry.captureException(error);
    console.error("LoginWithCart error:", error);
    return { error: "Something went wrong. Please try again." };
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
      variant: {
        include: {
          options: {
            include: {
              facetValue: {
                include: { facet: true },
              },
            },
          },
        },
      },
    },
  });

  return cartItems
    .filter((item) => item.product.isActive)
    .map((item) => {
      const variant = item.variant;
      const variantLabel = variant
        ? variant.options
            .map((o) => `${o.facetValue.facet.name}: ${o.facetValue.value}`)
            .join(" / ")
        : undefined;
      const effectivePrice = variant
        ? Number(variant.price)
        : Number(item.product.price);
      const effectiveStock = variant ? variant.stock : item.product.stock;

      return {
        id: item.product.id,
        variantId: item.variantId ?? undefined,
        name: item.product.name,
        variantLabel,
        price: effectivePrice,
        image: item.product.images[0] ?? "",
        quantity: Math.min(item.quantity, effectiveStock),
        stock: effectiveStock,
      };
    });
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
