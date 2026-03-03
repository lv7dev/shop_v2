import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";

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

export async function getAdminCategories(
  params: { page?: number; perPage?: number; search?: string } = {}
) {
  const { page = 1, perPage = 10, search } = params;
  const where: Prisma.CategoryWhereInput = { parentId: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      {
        children: {
          some: { name: { contains: search, mode: "insensitive" } },
        },
      },
    ];
  }

  const [data, total] = await Promise.all([
    db.category.findMany({
      where,
      include: {
        children: {
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { name: "asc" },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.category.count({ where }),
  ]);

  return { data, total, page, perPage };
}

export async function getAdminCategoryById(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  });
}

export async function getCategoryOptions() {
  return db.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
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
