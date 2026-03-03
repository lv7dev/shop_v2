import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";

export async function getFacets() {
  return db.facet.findMany({
    include: {
      values: {
        orderBy: { displayOrder: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getAdminFacets(
  params: { page?: number; perPage?: number; search?: string } = {}
) {
  const { page = 1, perPage = 10, search } = params;
  const where: Prisma.FacetWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    db.facet.findMany({
      where,
      include: {
        values: {
          orderBy: { displayOrder: "asc" },
          include: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.facet.count({ where }),
  ]);

  return { data, total, page, perPage };
}

export async function getFacetById(id: string) {
  return db.facet.findUnique({
    where: { id },
    include: {
      values: {
        orderBy: { displayOrder: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      },
    },
  });
}

export async function getFilterableFacets(filters?: {
  categorySlug?: string;
  search?: string;
  activeFacets?: Record<string, string[]>;
}) {
  const facets = await db.facet.findMany({
    include: {
      values: {
        orderBy: { displayOrder: "asc" },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  isActive: true,
                  category: { select: { slug: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Build base product filter (category + search + other active facets)
  return facets.map((facet) => ({
    id: facet.id,
    name: facet.name,
    slug: facet.slug,
    values: facet.values
      .map((value) => {
        // Count products matching this value that also match other active filters
        const count = value.products.filter((pfv) => {
          const product = pfv.product;
          if (!product.isActive) return false;
          if (filters?.categorySlug && product.category?.slug !== filters.categorySlug) return false;
          return true;
        }).length;

        return {
          id: value.id,
          value: value.value,
          slug: value.slug,
          count,
        };
      })
      .filter((v) => v.count > 0),
  })).filter((f) => f.values.length > 0);
}
