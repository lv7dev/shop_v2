import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CartDbItemInput } from "@/types/cart";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, items: [] },
      { status: 401 },
    );
  }

  const userId = session.userId;

  try {
    const body = await req.json();
    const { localCartItems, strategy } = body as {
      localCartItems: CartDbItemInput[];
      strategy: "merge" | "keep_db";
    };

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
        }),
      );

      if (mergedData.length > 0) {
        await db.$transaction([
          db.cartItem.deleteMany({ where: { userId } }),
          db.cartItem.createMany({ data: mergedData }),
        ]);
      }
    }
    // For "keep_db", no DB changes needed — just load existing

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

    const items = cartItems
      .filter((item) => item.product.isActive)
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        image: item.product.images[0] ?? "",
        quantity: Math.min(item.quantity, item.product.stock),
        stock: item.product.stock,
      }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Cart merge API error:", error);
    return NextResponse.json(
      { success: false, items: [] },
      { status: 500 },
    );
  }
}
