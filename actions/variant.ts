"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { variantSchema, saveVariantsSchema } from "@/lib/validations/product";

function serializeVariant(variant: Record<string, unknown>) {
  return {
    ...variant,
    price: Number(variant.price),
  };
}

export async function createVariant(productId: string, data: unknown) {
  await requireAdmin();

  const parsed = variantSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  if (input.sku) {
    const existing = await db.productVariant.findUnique({
      where: { sku: input.sku },
    });
    if (existing) {
      return { success: false, error: "SKU already exists" };
    }
  }

  const variant = await db.$transaction(async (tx) => {
    const v = await tx.productVariant.create({
      data: {
        productId,
        sku: input.sku || null,
        price: input.price,
        stock: input.stock,
      },
    });

    if (input.facetValueIds.length > 0) {
      await tx.variantFacetValue.createMany({
        data: input.facetValueIds.map((fvId) => ({
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

export async function updateVariant(variantId: string, data: unknown) {
  await requireAdmin();

  const parsed = variantSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  const existing = await db.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!existing) {
    return { success: false, error: "Variant not found" };
  }

  if (input.sku) {
    const skuExists = await db.productVariant.findFirst({
      where: { sku: input.sku, id: { not: variantId } },
    });
    if (skuExists) {
      return { success: false, error: "SKU already exists" };
    }
  }

  const variant = await db.$transaction(async (tx) => {
    const v = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        sku: input.sku || null,
        price: input.price,
        stock: input.stock,
      },
    });

    // Sync facet values
    await tx.variantFacetValue.deleteMany({
      where: { variantId },
    });

    if (input.facetValueIds.length > 0) {
      await tx.variantFacetValue.createMany({
        data: input.facetValueIds.map((fvId) => ({
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
  variants: unknown
) {
  await requireAdmin();

  const parsed = saveVariantsSchema.safeParse({ productId, variants });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  // Validate SKU uniqueness within the batch
  const skus = input.variants.filter((v) => v.sku).map((v) => v.sku!);
  const uniqueSkus = new Set(skus);
  if (skus.length !== uniqueSkus.size) {
    return { success: false, error: "Duplicate SKUs within variants" };
  }

  // Check SKUs against existing variants (excluding this product's variants)
  if (skus.length > 0) {
    const existingSkus = await db.productVariant.findMany({
      where: {
        sku: { in: skus },
        productId: { not: input.productId },
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
      where: { variant: { productId: input.productId } },
    });
    await tx.productVariant.deleteMany({
      where: { productId: input.productId },
    });

    // Create new variants
    for (const variant of input.variants) {
      const v = await tx.productVariant.create({
        data: {
          productId: input.productId,
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
