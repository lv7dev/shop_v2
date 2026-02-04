import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/generated/prisma/client";

export async function getOrdersByUserId(userId: string) {
  return db.order.findMany({
    where: { userId },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(id: string) {
  return db.order.findFirst({
    where: { id },
    include: {
      items: { include: { product: true } },
      address: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function createOrder(data: {
  userId: string;
  addressId?: string;
  items: { productId: string; quantity: number; price: number }[];
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  total: number;
  note?: string;
}) {
  return db.order.create({
    data: {
      userId: data.userId,
      addressId: data.addressId,
      subtotal: data.subtotal,
      shippingCost: data.shippingCost ?? 0,
      tax: data.tax ?? 0,
      total: data.total,
      note: data.note,
      items: {
        create: data.items,
      },
    },
    include: { items: true },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return db.order.update({
    where: { id },
    data: { status },
  });
}
