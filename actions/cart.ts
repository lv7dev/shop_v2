"use server";

import { db } from "@/lib/db";
import type { CartItemWithPrice } from "@/types/cart";

type ValidatedCartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  available: boolean;
  priceChanged: boolean;
  stockInsufficient: boolean;
};

export async function validateCart(items: CartItemWithPrice[]) {
  if (items.length === 0) {
    return { success: true, items: [], hasIssues: false };
  }

  const productIds = items.map((item) => item.id);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  });

  const validatedItems: ValidatedCartItem[] = items.map((item) => {
    const product = products.find((p) => p.id === item.id);

    if (!product || !product.isActive) {
      return {
        id: item.id,
        name: "Product unavailable",
        price: item.price,
        image: "",
        quantity: item.quantity,
        stock: 0,
        available: false,
        priceChanged: false,
        stockInsufficient: true,
      };
    }

    const currentPrice = Number(product.price);
    return {
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.images[0] ?? "",
      quantity: item.quantity,
      stock: product.stock,
      available: true,
      priceChanged: currentPrice !== item.price,
      stockInsufficient: product.stock < item.quantity,
    };
  });

  const hasIssues = validatedItems.some(
    (item) => !item.available || item.priceChanged || item.stockInsufficient
  );

  return { success: true, items: validatedItems, hasIssues };
}
