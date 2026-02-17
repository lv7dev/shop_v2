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

      // Key: productId or productId::variantId
      const mergedMap = new Map<
        string,
        { productId: string; variantId: string | null; quantity: number }
      >();

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
      for (const item of localCartItems) {
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

    const items = cartItems
      .filter((item) => item.product.isActive)
      .map((item) => {
        const variant = item.variant;
        const variantLabel = variant
          ? variant.options
              .map(
                (o) => `${o.facetValue.facet.name}: ${o.facetValue.value}`,
              )
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

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Cart merge API error:", error);
    return NextResponse.json(
      { success: false, items: [] },
      { status: 500 },
    );
  }
}
