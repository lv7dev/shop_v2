"use server";

import { db } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import type { OrderStatus, PaymentMethod } from "@/lib/generated/prisma/client";
import {
  createOrderSchema,
  orderStatusSchema,
} from "@/lib/validations/order";

function serializeOrder(order: Record<string, unknown>) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    discountAmount: Number(order.discountAmount),
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
  items: unknown,
  addressId?: string,
  note?: string,
  discountCode?: string,
  paymentMethod: string = "COD"
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please sign in to place an order" };
  }

  const parsed = createOrderSchema.safeParse({ items, addressId, note, discountCode, paymentMethod });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;
  const userId = session.userId;

  try {
    // Fetch products to verify prices and stock
    const productIds = input.items.map((item) => item.id);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    // Fetch variants if any items have variantId
    const variantIds = input.items
      .filter((item) => item.variantId)
      .map((item) => item.variantId!);
    const variants =
      variantIds.length > 0
        ? await db.productVariant.findMany({
            where: { id: { in: variantIds } },
          })
        : [];

    // Validate all products exist and are active
    const uniqueProductIds = new Set(input.items.map((i) => i.id));
    if (products.length !== uniqueProductIds.size) {
      return { success: false, error: "Some products are no longer available" };
    }

    // Validate stock (variant-aware)
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        return { success: false, error: `Product not found: ${item.id}` };
      }

      if (item.variantId) {
        const variant = variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return {
            success: false,
            error: `Variant not found for "${product.name}"`,
          };
        }
        if (variant.stock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${product.name}" variant. Available: ${variant.stock}`,
          };
        }
      } else {
        if (product.stock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          };
        }
      }
    }

    // Calculate totals from DB prices (not client prices)
    const orderItems = input.items.map((item) => {
      const product = products.find((p) => p.id === item.id)!;

      if (item.variantId) {
        const variant = variants.find((v) => v.id === item.variantId)!;
        return {
          productId: product.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price: variant.price,
        };
      }

      return {
        productId: product.id,
        variantId: null,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    // Validate and calculate discounts (supports multiple comma-separated codes)
    const validDiscountIds: string[] = [];
    const validDiscountCodes: string[] = [];
    let discountAmount = 0;

    if (input.discountCode) {
      const codes = input.discountCode
        .split(",")
        .map((c) => c.toUpperCase().trim())
        .filter(Boolean);

      const discounts = await db.discount.findMany({
        where: { code: { in: codes } },
        include: { products: true },
      });

      const now = new Date();

      for (const discount of discounts) {
        if (!discount.isActive) continue;

        const isValid =
          discount.startsAt <= now &&
          (!discount.expiresAt || discount.expiresAt >= now) &&
          (!discount.maxUses || discount.usedCount < discount.maxUses) &&
          (!discount.minOrder || subtotal >= Number(discount.minOrder));

        if (!isValid) continue;

        // Check stacking: if multiple discounts, all must be stackable
        if (discounts.length > 1 && !discount.stackable) continue;

        let amount = 0;
        if (discount.scope === "ORDER") {
          amount =
            discount.type === "PERCENTAGE"
              ? subtotal * (Number(discount.value) / 100)
              : Math.min(Number(discount.value), subtotal);
        } else {
          const eligibleIds = new Set(
            discount.products.map((dp) => dp.productId)
          );
          const eligibleSubtotal = orderItems.reduce((sum, oi) => {
            if (!eligibleIds.has(oi.productId)) return sum;
            return sum + Number(oi.price) * oi.quantity;
          }, 0);
          amount =
            discount.type === "PERCENTAGE"
              ? eligibleSubtotal * (Number(discount.value) / 100)
              : Math.min(Number(discount.value), eligibleSubtotal);
        }

        amount = Math.round(amount * 100) / 100;
        if (amount > 0) {
          validDiscountIds.push(discount.id);
          validDiscountCodes.push(discount.code);
          discountAmount += amount;
        }
      }

      // Cap total discount at subtotal
      discountAmount = Math.min(discountAmount, subtotal);
      discountAmount = Math.round(discountAmount * 100) / 100;
    }

    const shippingCost = subtotal >= 100 ? 0 : 10;
    const tax = (subtotal - discountAmount) * 0.08;
    const total = subtotal - discountAmount + shippingCost + tax;

    // Create order and decrement stock in a transaction
    const order = await db.$transaction(async (tx) => {
      // Decrement stock for each item
      for (const item of input.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Increment discount usage for all applied discounts
      for (const dId of validDiscountIds) {
        await tx.discount.update({
          where: { id: dId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.order.create({
        data: {
          userId,
          addressId: input.addressId || undefined,
          subtotal,
          shippingCost,
          tax,
          discountId: validDiscountIds[0] ?? null,
          discountCode: validDiscountCodes.length > 0
            ? validDiscountCodes.join(",")
            : null,
          discountAmount,
          total,
          note: input.note,
          paymentMethod: input.paymentMethod as PaymentMethod,
          paymentStatus: "PENDING",
          currency: input.paymentMethod === "MOMO" ? "VND" : "USD",
          paymentExpiry: input.paymentMethod !== "COD"
            ? new Date(Date.now() + 30 * 60 * 1000)
            : null,
          items: {
            create: orderItems.map((oi) => ({
              productId: oi.productId,
              variantId: oi.variantId,
              quantity: oi.quantity,
              price: oi.price,
            })),
          },
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

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();

  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { success: false, error: "Invalid order status" };
  }

  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: { status: parsed.data as OrderStatus },
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
