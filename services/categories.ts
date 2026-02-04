import { db } from "@/lib/db";

export async function getCategories() {
  return db.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      children: true,
      products: { where: { isActive: true }, take: 12 },
    },
  });
}
