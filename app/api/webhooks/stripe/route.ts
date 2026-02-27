import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            paymentId:
              (session.payment_intent as string) || session.id,
            status: "CONFIRMED",
          },
        });

        revalidatePath(`/orders/${orderId}`);
        revalidatePath("/orders");
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        const order = await db.order.findFirst({
          where: { id: orderId, paymentStatus: "PENDING" },
          include: { items: true },
        });

        if (order) {
          await db.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: orderId },
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
        }

        revalidatePath(`/orders/${orderId}`);
        revalidatePath("/orders");
        break;
      }
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error("Stripe webhook error:", error);
  }

  return NextResponse.json({ received: true });
}
