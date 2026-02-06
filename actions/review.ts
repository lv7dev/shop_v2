"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createReview(
  userId: string,
  productId: string,
  rating: number,
  comment?: string
) {
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

export async function deleteReview(reviewId: string, userId: string) {
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
