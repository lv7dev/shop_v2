"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type VariantInput = {
  sku?: string;
  price: number;
  stock: number;
  facetValueIds: string[];
};

function serializeVariant(variant: Record<string, unknown>) {
  return {
    ...variant,
    price: Number(variant.price),
  };
}

export async function createVariant(productId: string, data: VariantInput) {
  await requireAdmin();

  if (data.sku) {
    const existing = await db.productVariant.findUnique({
      where: { sku: data.sku },
    });
    if (existing) {
      return { success: false, error: "SKU already exists" };
    }
  }

  const variant = await db.$transaction(async (tx) => {
    const v = await tx.productVariant.create({
      data: {
        productId,
        sku: data.sku || null,
        price: data.price,
        stock: data.stock,
      },
    });

    if (data.facetValueIds.length > 0) {
      await tx.variantFacetValue.createMany({
        data: data.facetValueIds.map((fvId) => ({
          variantId: v.id,
          facetValueId: fvId,
        })),
      });
    }

    return v;
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");

  return { success: true, variant: serializeVariant(variant) };
}

export async function updateVariant(variantId: string, data: VariantInput) {
  await requireAdmin();

  const existing = await db.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!existing) {
    return { success: false, error: "Variant not found" };
  }

  if (data.sku) {
    const skuExists = await db.productVariant.findFirst({
      where: { sku: data.sku, id: { not: variantId } },
    });
    if (skuExists) {
      return { success: false, error: "SKU already exists" };
    }
  }

  const variant = await db.$transaction(async (tx) => {
    const v = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        sku: data.sku || null,
        price: data.price,
        stock: data.stock,
      },
    });

    // Sync facet values
    await tx.variantFacetValue.deleteMany({
      where: { variantId },
    });

    if (data.facetValueIds.length > 0) {
      await tx.variantFacetValue.createMany({
        data: data.facetValueIds.map((fvId) => ({
          variantId,
          facetValueId: fvId,
        })),
      });
    }

    return v;
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");

  return { success: true, variant: serializeVariant(variant) };
}

export async function deleteVariant(variantId: string) {
  await requireAdmin();

  const existing = await db.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!existing) {
    return { success: false, error: "Variant not found" };
  }

  await db.productVariant.delete({ where: { id: variantId } });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");

  return { success: true };
}

export async function saveProductVariants(
  productId: string,
  variants: VariantInput[]
) {
  await requireAdmin();

  // Validate SKU uniqueness within the batch
  const skus = variants.filter((v) => v.sku).map((v) => v.sku!);
  const uniqueSkus = new Set(skus);
  if (skus.length !== uniqueSkus.size) {
    return { success: false, error: "Duplicate SKUs within variants" };
  }

  // Check SKUs against existing variants (excluding this product's variants)
  if (skus.length > 0) {
    const existingSkus = await db.productVariant.findMany({
      where: {
        sku: { in: skus },
        productId: { not: productId },
      },
      select: { sku: true },
    });
    if (existingSkus.length > 0) {
      return {
        success: false,
        error: `SKU already exists: ${existingSkus.map((s) => s.sku).join(", ")}`,
      };
    }
  }

  await db.$transaction(async (tx) => {
    // Delete all existing variants for this product
    await tx.variantFacetValue.deleteMany({
      where: { variant: { productId } },
    });
    await tx.productVariant.deleteMany({
      where: { productId },
    });

    // Create new variants
    for (const variant of variants) {
      const v = await tx.productVariant.create({
        data: {
          productId,
          sku: variant.sku || null,
          price: variant.price,
          stock: variant.stock,
        },
      });

      if (variant.facetValueIds.length > 0) {
        await tx.variantFacetValue.createMany({
          data: variant.facetValueIds.map((fvId) => ({
            variantId: v.id,
            facetValueId: fvId,
          })),
        });
      }
    }
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");

  return { success: true };
}
