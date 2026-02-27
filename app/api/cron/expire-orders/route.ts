import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiredOrders = await db.order.findMany({
    where: {
      paymentStatus: "PENDING",
      paymentMethod: { in: ["STRIPE", "MOMO"] },
      paymentExpiry: { lt: new Date() },
    },
    include: { items: true },
  });

  let cancelled = 0;
  for (const order of expiredOrders) {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "EXPIRED", status: "CANCELLED" },
      });
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });
    cancelled++;
  }

  return NextResponse.json({ expired: cancelled });
}
