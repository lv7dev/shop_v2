import { db } from "@/lib/db";

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
