import { db } from "@/lib/db";

export async function getAdminStats() {
  const [totalRevenue, orderCount, productCount, customerCount, recentOrders] =
    await Promise.all([
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
      }),
      db.order.count(),
      db.product.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

  return {
    totalRevenue: Number(totalRevenue._sum.total ?? 0),
    orderCount,
    productCount,
    customerCount,
    recentOrders,
  };
}

export async function getAdminProducts() {
  return db.product.findMany({
    include: {
      category: { select: { name: true } },
      _count: { select: { orderItems: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      category: true,
      facetValues: {
        include: {
          facetValue: {
            include: { facet: true },
          },
        },
      },
      variants: {
        include: {
          options: {
            include: {
              facetValue: {
                include: { facet: true },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });
}

export async function getAdminOrders() {
  return db.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminUsers() {
  return db.user.findMany({
    include: {
      _count: { select: { orders: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminDiscounts() {
  return db.discount.findMany({
    include: {
      products: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminDiscountById(id: string) {
  return db.discount.findUnique({
    where: { id },
    include: {
      products: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
  });
}
