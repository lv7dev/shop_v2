"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { productSchema, productUpdateSchema } from "@/lib/validations/product";

function serializeProduct(product: Record<string, unknown>) {
  return {
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
  };
}

export async function createProduct(data: unknown) {
  await requireAdmin();

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;
  const slug = slugify(input.name);

  // Check slug uniqueness
  const existing = await db.product.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, error: "A product with this name already exists" };
  }

  if (input.sku) {
    const existingSku = await db.product.findUnique({
      where: { sku: input.sku },
    });
    if (existingSku) {
      return { success: false, error: "SKU already exists" };
    }
  }

  const product = await db.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        price: input.price,
        comparePrice: input.comparePrice ?? null,
        sku: input.sku || null,
        stock: input.stock,
        images: input.images,
        attributes: input.attributes ?? undefined,
        isActive: input.isActive,
        categoryId: input.categoryId || null,
      },
    });

    if (input.facetValueIds.length > 0) {
      await tx.productFacetValue.createMany({
        data: input.facetValueIds.map((fvId) => ({
          productId: p.id,
          facetValueId: fvId,
        })),
      });
    }

    return p;
  });

  revalidatePath("/products");
  revalidatePath("/dashboard/products");

  return { success: true, product: serializeProduct(product) };
}

export async function updateProduct(id: string, data: unknown) {
  await requireAdmin();

  const parsed = productUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    return { success: false, error: "Product not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
    updateData.slug = slugify(input.name);
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

  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.comparePrice !== undefined) updateData.comparePrice = input.comparePrice ?? null;
  if (input.sku !== undefined) {
    if (input.sku) {
      const existingSku = await db.product.findFirst({
        where: { sku: input.sku, id: { not: id } },
      });
      if (existingSku) {
        return { success: false, error: "SKU already exists" };
      }
    }
    updateData.sku = input.sku || null;
  }
  if (input.stock !== undefined) updateData.stock = input.stock;
  if (input.images !== undefined) updateData.images = input.images;
  if (input.attributes !== undefined) updateData.attributes = input.attributes ?? undefined;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId || null;

  const updated = await db.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id },
      data: updateData,
    });

    if (input.facetValueIds !== undefined) {
      await tx.productFacetValue.deleteMany({
        where: { productId: id },
      });
      if (input.facetValueIds.length > 0) {
        await tx.productFacetValue.createMany({
          data: input.facetValueIds.map((fvId) => ({
            productId: id,
            facetValueId: fvId,
          })),
        });
      }
    }

    return p;
  });

  revalidatePath("/products");
  revalidatePath(`/products/${updated.slug}`);
  revalidatePath("/dashboard/products");

  return { success: true, product: serializeProduct(updated) };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    return { success: false, error: "Product not found" };
  }

  await db.product.delete({ where: { id } });

  revalidatePath("/products");
  revalidatePath("/admin/products");

  return { success: true };
}
