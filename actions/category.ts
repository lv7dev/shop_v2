"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { categorySchema, categoryUpdateSchema } from "@/lib/validations/category";

export async function createCategory(data: unknown) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;
  const slug = slugify(input.name);

  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) {
    return {
      success: false,
      error: "A category with this name already exists",
    };
  }

  if (input.parentId) {
    const parent = await db.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) {
      return { success: false, error: "Parent category not found" };
    }
  }

  const category = await db.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description || null,
      image: input.image || null,
      parentId: input.parentId || null,
    },
  });

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/admin/categories");

  return { success: true, category };
}

export async function updateCategory(
  id: string,
  data: unknown
) {
  await requireAdmin();

  const parsed = categoryUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  const category = await db.category.findUnique({ where: { id } });
  if (!category) {
    return { success: false, error: "Category not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
    updateData.slug = slugify(input.name);
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

  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.image !== undefined) updateData.image = input.image || null;
  if (input.parentId !== undefined) {
    if (input.parentId === id) {
      return { success: false, error: "Category cannot be its own parent" };
    }
    updateData.parentId = input.parentId || null;
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
