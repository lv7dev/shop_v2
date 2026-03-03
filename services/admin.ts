import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";

type PaginationParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

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

export async function getAdminProducts(
  params: PaginationParams & { status?: string } = {}
) {
  const { page = 1, perPage = 10, search, status } = params;
  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [data, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        _count: { select: { orderItems: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.product.count({ where }),
  ]);

  return { data, total, page, perPage };
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

export async function getAdminOrders(
  params: PaginationParams & { status?: string } = {}
) {
  const { page = 1, perPage = 10, search, status } = params;
  const where: Prisma.OrderWhereInput = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status) {
    where.status = status as Prisma.EnumOrderStatusFilter;
  }

  const [data, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.order.count({ where }),
  ]);

  return { data, total, page, perPage };
}

export async function getAdminUsers(
  params: PaginationParams & { role?: string } = {}
) {
  const { page = 1, perPage = 10, search, role } = params;
  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) {
    where.role = role as Prisma.EnumRoleFilter;
  }

  const [data, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        _count: { select: { orders: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.user.count({ where }),
  ]);

  return { data, total, page, perPage };
}

export async function getAdminDiscounts(
  params: PaginationParams & { status?: string } = {}
) {
  const { page = 1, perPage = 10, search, status } = params;
  const where: Prisma.DiscountWhereInput = {};

  if (search) {
    where.code = { contains: search, mode: "insensitive" };
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (status === "expired") {
    where.expiresAt = { lt: new Date() };
  }
  if (status === "scheduled") {
    where.startsAt = { gt: new Date() };
  }

  const [data, total] = await Promise.all([
    db.discount.findMany({
      where,
      include: {
        products: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.discount.count({ where }),
  ]);

  return { data, total, page, perPage };
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

// Simple product list for forms (discount product selection etc.)
export async function getProductOptions() {
  return db.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
