"use server";

import { db } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import type { CartItemInput } from "@/types/cart";

function serializeOrder(order: Record<string, unknown>) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    total: Number(order.total),
    items: Array.isArray(order.items)
      ? order.items.map((item: Record<string, unknown>) => ({
          ...item,
          price: Number(item.price),
        }))
      : undefined,
  };
}

export async function createOrder(
  items: CartItemInput[],
  addressId?: string,
  note?: string
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please sign in to place an order" };
  }
  const userId = session.userId;
  if (items.length === 0) {
    return { success: false, error: "Cart is empty" };
  }

  try {
    // Fetch products to verify prices and stock
    const productIds = items.map((item) => item.id);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    // Validate all products exist and are active
    if (products.length !== items.length) {
      return { success: false, error: "Some products are no longer available" };
    }

    // Validate stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        return { success: false, error: `Product not found: ${item.id}` };
      }
      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        };
      }
    }

    // Calculate totals from DB prices (not client prices)
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.id)!;
      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const shippingCost = subtotal >= 100 ? 0 : 10;
    const tax = subtotal * 0.08;
    const total = subtotal + shippingCost + tax;

    // Create order and decrement stock in a transaction
    const order = await db.$transaction(async (tx) => {
      // Decrement stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          userId,
          addressId: addressId || undefined,
          subtotal,
          shippingCost,
          tax,
          total,
          note,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });

    revalidatePath("/orders");
    revalidatePath("/products");

    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Create order error:", error);
    return { success: false, error: "Failed to place order. Please try again." };
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();

  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");

    return { success: true, order: serializeOrder(updated) };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Update order status error:", error);
    return { success: false, error: "Failed to update order status." };
  }
}

export async function cancelOrder(orderId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: session.userId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return { success: false, error: "Order cannot be cancelled at this stage" };
    }

    // Cancel order and restore stock in a transaction
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Cancel order error:", error);
    return { success: false, error: "Failed to cancel order. Please try again." };
  }
}
