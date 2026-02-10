"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createReview(
  productId: string,
  rating: number,
  comment?: string
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please sign in to leave a review" };
  }
  const userId = session.userId;

  if (rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" };
  }

  // Check product exists
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { success: false, error: "Product not found" };
  }

  // Check if user already reviewed this product
  const existing = await db.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    return { success: false, error: "You have already reviewed this product" };
  }

  const review = await db.review.create({
    data: {
      userId,
      productId,
      rating,
      comment: comment || null,
    },
  });

  revalidatePath(`/products/${product.slug}`);

  return { success: true, review };
}

export async function deleteReview(reviewId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.userId;

  const review = await db.review.findFirst({
    where: { id: reviewId, userId },
    include: { product: { select: { slug: true } } },
  });

  if (!review) {
    return { success: false, error: "Review not found" };
  }

  await db.review.delete({ where: { id: reviewId } });

  revalidatePath(`/products/${review.product.slug}`);

  return { success: true };
}
