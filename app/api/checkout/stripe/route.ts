import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();

  const order = await db.order.findFirst({
    where: { id: orderId, userId: session.userId, paymentMethod: "STRIPE" },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.paymentStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Order not found or already paid" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    currency: order.currency.toLowerCase(),
    line_items: [
      {
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: `Order #${order.orderNumber.slice(-8).toUpperCase()}`,
          },
          unit_amount: Math.round(Number(order.total) * (order.currency === "VND" ? 1 : 100)),
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
    success_url: `${appUrl}/orders/${order.id}?new=true&payment=success`,
    cancel_url: `${appUrl}/orders/${order.id}?payment=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await db.order.update({
    where: { id: order.id },
    data: { paymentId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
