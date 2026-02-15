"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";
import type { CartDbItemInput } from "@/types/cart";

export type EnrichedCartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
};

async function getAuthUserId() {
  const session = await getSession();
  if (!session) return null;
  return session.userId;
}

export async function loadCartFromDB(): Promise<{
  success: boolean;
  items: EnrichedCartItem[];
}> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, items: [] };

  try {
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

    const items: EnrichedCartItem[] = cartItems
      .filter((item) => item.product.isActive)
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        image: item.product.images[0] ?? "",
        quantity: Math.min(item.quantity, item.product.stock),
        stock: item.product.stock,
      }));

    return { success: true, items };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error loading cart from DB:", error);
    return { success: false, items: [] };
  }
}

export async function saveCartToDB(items: CartDbItemInput[]) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    await db.$transaction([
      db.cartItem.deleteMany({ where: { userId } }),
      ...(items.length > 0
        ? [
            db.cartItem.createMany({
              data: items.map((item) => ({
                userId,
                productId: item.productId,
                quantity: item.quantity,
              })),
            }),
          ]
        : []),
    ]);

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error saving cart to DB:", error);
    return { success: false };
  }
}

export async function syncCartItemToDB(productId: string, quantity: number) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    if (quantity <= 0) {
      await db.cartItem.deleteMany({
        where: { userId, productId },
      });
    } else {
      await db.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        update: { quantity },
        create: { userId, productId, quantity },
      });
    }

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error syncing cart item to DB:", error);
    return { success: false };
  }
}

export async function removeCartItemFromDB(productId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    await db.cartItem.deleteMany({
      where: { userId, productId },
    });

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error removing cart item from DB:", error);
    return { success: false };
  }
}

export async function clearCartDB() {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    await db.cartItem.deleteMany({ where: { userId } });

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error clearing cart DB:", error);
    return { success: false };
  }
}

export async function mergeCartsInDB(localItems: CartDbItemInput[]) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    const existingItems = await db.cartItem.findMany({
      where: { userId },
    });

    const mergedMap = new Map<string, number>();

    for (const item of existingItems) {
      mergedMap.set(item.productId, item.quantity);
    }

    for (const item of localItems) {
      const existing = mergedMap.get(item.productId) || 0;
      mergedMap.set(item.productId, existing + item.quantity);
    }

    const mergedData = Array.from(mergedMap.entries()).map(
      ([productId, quantity]) => ({
        userId,
        productId,
        quantity,
      }),
    );

    if (mergedData.length === 0) {
      return { success: true };
    }

    await db.$transaction([
      db.cartItem.deleteMany({ where: { userId } }),
      db.cartItem.createMany({
        data: mergedData,
      }),
    ]);

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("mergeCartsInDB error:", error);
    return { success: false };
  }
}
