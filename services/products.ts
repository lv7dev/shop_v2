import { db } from "@/lib/db";

export async function getProducts({
  categorySlug,
  search,
  facets,
  minPrice,
  maxPrice,
  page = 1,
  limit = 12,
}: {
  categorySlug?: string;
  search?: string;
  facets?: Record<string, string[]>;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
} = {}) {
  // Build facet AND conditions: each facet key is ANDed, values within are ORed
  const facetConditions =
    facets && Object.keys(facets).length > 0
      ? Object.entries(facets).map(([facetSlug, valueSlugs]) => ({
          facetValues: {
            some: {
              facetValue: {
                facet: { slug: facetSlug },
                slug: { in: valueSlugs },
              },
            },
          },
        }))
      : [];

  const priceFilter: Record<string, number> = {};
  if (minPrice !== undefined) priceFilter.gte = minPrice;
  if (maxPrice !== undefined) priceFilter.lte = maxPrice;

  const where = {
    isActive: true,
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
    ...(facetConditions.length > 0 && { AND: facetConditions }),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: { include: { user: { select: { name: true, image: true } } } },
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

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const products = await db.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { category: true },
  });
  // Preserve the order of the input IDs
  const productMap = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => productMap.get(id)).filter(Boolean) as typeof products;
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
) {
  return db.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      ...(categoryId && { categoryId }),
    },
    include: { category: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

// ──────────────────────────────────────
// Product Discount Helpers
// ──────────────────────────────────────

export type ProductDiscount = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
};

/**
 * Returns a Map of productId → best active discount for those products.
 * Includes both product-scoped discounts AND order-scoped discounts.
 * For display purposes, product-scoped discounts take priority.
 */
export async function getActiveDiscountsForProducts(
  productIds: string[]
): Promise<Map<string, ProductDiscount>> {
  if (productIds.length === 0) return new Map();

  const now = new Date();

  // Find product-scoped discounts linked to these products
  const productDiscounts = await db.discountProduct.findMany({
    where: {
      productId: { in: productIds },
      discount: {
        isActive: true,
        startsAt: { lte: now },
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
    },
    include: {
      discount: { select: { code: true, type: true, value: true, maxUses: true, usedCount: true } },
    },
  });

  // Filter out discounts that have exceeded max uses (done in JS since Prisma
  // can't compare two columns directly)
  const validDiscounts = productDiscounts.filter(
    (dp) => !dp.discount.maxUses || dp.discount.usedCount < dp.discount.maxUses
  );

  const discountMap = new Map<string, ProductDiscount>();

  for (const dp of validDiscounts) {
    const existing = discountMap.get(dp.productId);
    const val = Number(dp.discount.value);
    // Keep the highest-value discount per product
    if (!existing || val > existing.value) {
      discountMap.set(dp.productId, {
        code: dp.discount.code,
        type: dp.discount.type,
        value: val,
      });
    }
  }

  return discountMap;
}

/**
 * Returns the best active discount for a single product (product-scoped only).
 */
export async function getActiveDiscountForProduct(
  productId: string
): Promise<ProductDiscount | null> {
  const map = await getActiveDiscountsForProducts([productId]);
  return map.get(productId) ?? null;
}
