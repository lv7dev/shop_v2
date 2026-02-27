import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMomoPayment } from "@/lib/momo";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, requestType = "captureWallet" } = await req.json();

  const order = await db.order.findFirst({
    where: { id: orderId, userId: session.userId, paymentMethod: "MOMO" },
  });

  if (!order || order.paymentStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Order not found or already paid" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const amount = Math.round(Number(order.total));

  const result = await createMomoPayment({
    orderId: order.id,
    orderInfo: `Payment for Order #${order.orderNumber.slice(-8).toUpperCase()}`,
    amount,
    returnUrl: `${appUrl}/orders/${order.id}?new=true&payment=momo`,
    notifyUrl: `${appUrl}/api/webhooks/momo`,
    requestType,
  });

  if (!result.payUrl) {
    return NextResponse.json(
      { error: result.message || "Failed to create MoMo payment" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    payUrl: result.payUrl,
    deeplink: result.deeplink,
    qrCodeUrl: result.qrCodeUrl,
  });
}
