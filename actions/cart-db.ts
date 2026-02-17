"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";
import type { CartDbItemInput } from "@/types/cart";

export type EnrichedCartItem = {
  id: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
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

    const items: EnrichedCartItem[] = cartItems
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
                variantId: item.variantId ?? null,
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

export async function syncCartItemToDB(
  productId: string,
  quantity: number,
  variantId?: string
) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    if (quantity <= 0) {
      await db.cartItem.deleteMany({
        where: { userId, productId, variantId: variantId ?? null },
      });
    } else {
      // Find existing item first, then update or create
      const existing = await db.cartItem.findFirst({
        where: { userId, productId, variantId: variantId ?? null },
      });

      if (existing) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: { quantity },
        });
      } else {
        await db.cartItem.create({
          data: {
            userId,
            productId,
            variantId: variantId ?? null,
            quantity,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error syncing cart item to DB:", error);
    return { success: false };
  }
}

export async function removeCartItemFromDB(
  productId: string,
  variantId?: string
) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    await db.cartItem.deleteMany({
      where: { userId, productId, variantId: variantId ?? null },
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

    // Key: productId or productId::variantId
    const mergedMap = new Map<string, { productId: string; variantId: string | null; quantity: number }>();

    for (const item of existingItems) {
      const key = item.variantId
        ? `${item.productId}::${item.variantId}`
        : item.productId;
      mergedMap.set(key, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }

    for (const item of localItems) {
      const key = item.variantId
        ? `${item.productId}::${item.variantId}`
        : item.productId;
      const existing = mergedMap.get(key);
      mergedMap.set(key, {
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: (existing?.quantity || 0) + item.quantity,
      });
    }

    const mergedData = Array.from(mergedMap.values()).map((entry) => ({
      userId,
      productId: entry.productId,
      variantId: entry.variantId,
      quantity: entry.quantity,
    }));

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
