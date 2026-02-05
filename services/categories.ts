import { db } from "@/lib/db";

export async function getCategories() {
  return db.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          _count: { select: { products: { where: { isActive: true } } } },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      children: {
        include: {
          _count: { select: { products: { where: { isActive: true } } } },
        },
        orderBy: { name: "asc" },
      },
      parent: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
}
