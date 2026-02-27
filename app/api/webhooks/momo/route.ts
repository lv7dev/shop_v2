import { NextRequest, NextResponse } from "next/server";
import { verifyMomoSignature } from "@/lib/momo";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!verifyMomoSignature(body)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { orderId, resultCode, transId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await db.order.findFirst({
      where: { id: orderId, paymentMethod: "MOMO", paymentStatus: "PENDING" },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (resultCode === 0) {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          paymentId: String(transId),
          status: "CONFIRMED",
        },
      });
    } else {
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED", status: "CANCELLED" },
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
    }

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    Sentry.captureException(error);
    console.error("MoMo webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
