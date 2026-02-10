"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

type CategoryInput = {
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
};

export async function createCategory(data: CategoryInput) {
  await requireAdmin();
  const slug = slugify(data.name);

  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) {
    return {
      success: false,
      error: "A category with this name already exists",
    };
  }

  if (data.parentId) {
    const parent = await db.category.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      return { success: false, error: "Parent category not found" };
    }
  }

  const category = await db.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      image: data.image || null,
      parentId: data.parentId || null,
    },
  });

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/admin/categories");

  return { success: true, category };
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryInput>
) {
  await requireAdmin();
  const category = await db.category.findUnique({ where: { id } });
  if (!category) {
    return { success: false, error: "Category not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = slugify(data.name);
    const existing = await db.category.findFirst({
      where: { slug: updateData.slug as string, id: { not: id } },
    });
    if (existing) {
      return {
        success: false,
        error: "A category with this name already exists",
      };
    }
  }

  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.image !== undefined) updateData.image = data.image || null;
  if (data.parentId !== undefined) {
    if (data.parentId === id) {
      return { success: false, error: "Category cannot be its own parent" };
    }
    updateData.parentId = data.parentId || null;
  }

  const updated = await db.category.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/admin/categories");

  return { success: true, category: updated };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const category = await db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, children: true } },
    },
  });

  if (!category) {
    return { success: false, error: "Category not found" };
  }

  if (category._count.products > 0) {
    return {
      success: false,
      error: "Cannot delete category that has products. Reassign products first.",
    };
  }

  if (category._count.children > 0) {
    return {
      success: false,
      error: "Cannot delete category that has subcategories. Remove subcategories first.",
    };
  }

  await db.category.delete({ where: { id } });

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/admin/categories");

  return { success: true };
}
