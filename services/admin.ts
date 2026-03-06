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

export async function getLowStockProducts(limit = 10) {
  // Products where stock <= lowStockThreshold (excluding inactive)
  const products = await db.$queryRaw<
    {
      id: string;
      name: string;
      slug: string;
      stock: number;
      lowStockThreshold: number;
      images: string[];
    }[]
  >`
    SELECT id, name, slug, stock, "lowStockThreshold", images
    FROM products
    WHERE "isActive" = true AND stock <= "lowStockThreshold"
    ORDER BY stock ASC, name ASC
    LIMIT ${limit}
  `;

  // Also get variants below threshold
  const variants = await db.$queryRaw<
    {
      id: string;
      sku: string | null;
      stock: number;
      productId: string;
      productName: string;
      productSlug: string;
      lowStockThreshold: number;
      images: string[];
    }[]
  >`
    SELECT pv.id, pv.sku, pv.stock, pv."productId",
           p.name AS "productName", p.slug AS "productSlug",
           p."lowStockThreshold", p.images
    FROM product_variants pv
    JOIN products p ON p.id = pv."productId"
    WHERE p."isActive" = true AND pv.stock <= p."lowStockThreshold"
    ORDER BY pv.stock ASC
    LIMIT ${limit}
  `;

  return { products, variants };
}

export async function getLowStockCount() {
  const [productResult, variantResult] = await Promise.all([
    db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM products
      WHERE "isActive" = true AND stock <= "lowStockThreshold"
    `.catch(() => [{ count: BigInt(0) }]),
    db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM product_variants pv
      JOIN products p ON p.id = pv."productId"
      WHERE p."isActive" = true AND pv.stock <= p."lowStockThreshold"
    `.catch(() => [{ count: BigInt(0) }]),
  ]);

  return Number(productResult[0].count) + Number(variantResult[0].count);
}

// ──────────────────────────────────────
// Analytics
// ──────────────────────────────────────

export async function getRevenueOverTime(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.$queryRaw<{ date: Date; revenue: number }[]>`
    SELECT DATE("createdAt") as date, COALESCE(SUM(total), 0)::float as revenue
    FROM orders
    WHERE "createdAt" >= ${since}
      AND status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Fill in missing days with 0
  const map = new Map(rows.map((r) => [new Date(r.date).toISOString().slice(0, 10), r.revenue]));
  const result: { date: string; revenue: number }[] = [];
  for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, revenue: map.get(key) ?? 0 });
  }
  return result;
}

export async function getOrdersPerDay(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.$queryRaw<{ date: Date; orders: number }[]>`
    SELECT DATE("createdAt") as date, COUNT(*)::int as orders
    FROM orders
    WHERE "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  const map = new Map(rows.map((r) => [new Date(r.date).toISOString().slice(0, 10), r.orders]));
  const result: { date: string; orders: number }[] = [];
  for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, orders: map.get(key) ?? 0 });
  }
  return result;
}

export async function getTopSellingProducts(limit = 10) {
  const rows = await db.$queryRaw<{ name: string; sold: number }[]>`
    SELECT p.name, COALESCE(SUM(oi.quantity), 0)::int as sold
    FROM order_items oi
    JOIN products p ON p.id = oi."productId"
    JOIN orders o ON o.id = oi."orderId"
    WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY p.id, p.name
    ORDER BY sold DESC
    LIMIT ${limit}
  `;
  return rows;
}

// Simple product list for forms (discount product selection etc.)
export async function getProductOptions() {
  return db.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
