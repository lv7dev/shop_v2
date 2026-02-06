"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

type ProductInput = {
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stock: number;
  images: string[];
  attributes?: Record<string, string>;
  isActive?: boolean;
  categoryId?: string;
};

export async function createProduct(data: ProductInput) {
  const slug = slugify(data.name);

  // Check slug uniqueness
  const existing = await db.product.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, error: "A product with this name already exists" };
  }

  if (data.sku) {
    const existingSku = await db.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      return { success: false, error: "SKU already exists" };
    }
  }

  const product = await db.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      price: data.price,
      comparePrice: data.comparePrice ?? null,
      sku: data.sku || null,
      stock: data.stock,
      images: data.images,
      attributes: data.attributes ?? undefined,
      isActive: data.isActive ?? true,
      categoryId: data.categoryId || null,
    },
  });

  revalidatePath("/products");
  revalidatePath("/admin/products");

  return { success: true, product };
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    return { success: false, error: "Product not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = slugify(data.name);
    // Check slug uniqueness (excluding current product)
    const existing = await db.product.findFirst({
      where: { slug: updateData.slug as string, id: { not: id } },
    });
    if (existing) {
      return {
        success: false,
        error: "A product with this name already exists",
      };
    }
  }

  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice ?? null;
  if (data.sku !== undefined) {
    if (data.sku) {
      const existingSku = await db.product.findFirst({
        where: { sku: data.sku, id: { not: id } },
      });
      if (existingSku) {
        return { success: false, error: "SKU already exists" };
      }
    }
    updateData.sku = data.sku || null;
  }
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.attributes !== undefined) updateData.attributes = data.attributes ?? undefined;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;

  const updated = await db.product.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${updated.slug}`);
  revalidatePath("/admin/products");

  return { success: true, product: updated };
}

export async function deleteProduct(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    return { success: false, error: "Product not found" };
  }

  await db.product.delete({ where: { id } });

  revalidatePath("/products");
  revalidatePath("/admin/products");

  return { success: true };
}
