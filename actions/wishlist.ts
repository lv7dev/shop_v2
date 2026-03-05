"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";

export type EnrichedWishlistItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  stock: number;
  category?: { name: string; slug: string } | null;
};

async function getAuthUserId() {
  const session = await getSession();
  if (!session) return null;
  return session.userId;
}

export async function loadWishlistFromDB(): Promise<{
  success: boolean;
  items: EnrichedWishlistItem[];
}> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, items: [] };

  try {
    const wishlistItems = await db.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            stock: true,
            isActive: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items: EnrichedWishlistItem[] = wishlistItems
      .filter((item) => item.product.isActive)
      .map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price),
        image: item.product.images[0] ?? "",
        stock: item.product.stock,
        category: item.product.category,
      }));

    return { success: true, items };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error loading wishlist from DB:", error);
    return { success: false, items: [] };
  }
}

export async function addWishlistItemToDB(
  productId: string
): Promise<{ success: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    const existing = await db.wishlistItem.findFirst({
      where: { userId, productId },
    });

    if (!existing) {
      await db.wishlistItem.create({
        data: { userId, productId },
      });
    }

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error adding wishlist item to DB:", error);
    return { success: false };
  }
}

export async function removeWishlistItemFromDB(
  productId: string
): Promise<{ success: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    await db.wishlistItem.deleteMany({
      where: { userId, productId },
    });

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error removing wishlist item from DB:", error);
    return { success: false };
  }
}

export async function clearWishlistDB(): Promise<{ success: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    await db.wishlistItem.deleteMany({ where: { userId } });
    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error clearing wishlist DB:", error);
    return { success: false };
  }
}

export async function mergeWishlistInDB(
  localProductIds: string[]
): Promise<{ success: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false };

  try {
    if (localProductIds.length === 0) return { success: true };

    await db.wishlistItem.createMany({
      data: localProductIds.map((productId) => ({ userId, productId })),
      skipDuplicates: true,
    });

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("mergeWishlistInDB error:", error);
    return { success: false };
  }
}
