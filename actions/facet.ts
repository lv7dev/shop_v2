"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

type FacetInput = {
  name: string;
  displayOrder?: number;
};

type FacetValueInput = {
  value: string;
  displayOrder?: number;
};

export async function createFacet(data: FacetInput) {
  await requireAdmin();
  const slug = slugify(data.name);

  const existing = await db.facet.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, error: "A facet with this name already exists" };
  }

  const facet = await db.facet.create({
    data: {
      name: data.name,
      slug,
      displayOrder: data.displayOrder ?? 0,
    },
  });

  revalidatePath("/dashboard/facets");
  revalidatePath("/products");

  return { success: true, facet };
}

export async function updateFacet(id: string, data: Partial<FacetInput>) {
  await requireAdmin();

  const facet = await db.facet.findUnique({ where: { id } });
  if (!facet) {
    return { success: false, error: "Facet not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = slugify(data.name);
    const existing = await db.facet.findFirst({
      where: { slug: updateData.slug as string, id: { not: id } },
    });
    if (existing) {
      return { success: false, error: "A facet with this name already exists" };
    }
  }

  if (data.displayOrder !== undefined) {
    updateData.displayOrder = data.displayOrder;
  }

  const updated = await db.facet.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/dashboard/facets");
  revalidatePath("/products");

  return { success: true, facet: updated };
}

export async function deleteFacet(id: string) {
  await requireAdmin();

  const facet = await db.facet.findUnique({ where: { id } });
  if (!facet) {
    return { success: false, error: "Facet not found" };
  }

  // Cascade delete will remove values and product associations
  await db.facet.delete({ where: { id } });

  revalidatePath("/dashboard/facets");
  revalidatePath("/products");

  return { success: true };
}

export async function createFacetValue(facetId: string, data: FacetValueInput) {
  await requireAdmin();

  const facet = await db.facet.findUnique({ where: { id: facetId } });
  if (!facet) {
    return { success: false, error: "Facet not found" };
  }

  const slug = slugify(data.value);
  const existing = await db.facetValue.findUnique({
    where: { facetId_slug: { facetId, slug } },
  });
  if (existing) {
    return { success: false, error: "This value already exists for this facet" };
  }

  const value = await db.facetValue.create({
    data: {
      facetId,
      value: data.value,
      slug,
      displayOrder: data.displayOrder ?? 0,
    },
  });

  revalidatePath("/dashboard/facets");
  revalidatePath("/products");

  return { success: true, value };
}

/**
 * Create multiple facet values at once (comma-separated input).
 * Skips duplicates and returns count of created values.
 */
export async function createFacetValuesBatch(
  facetId: string,
  values: string[]
) {
  await requireAdmin();

  const facet = await db.facet.findUnique({ where: { id: facetId } });
  if (!facet) {
    return { success: false as const, error: "Facet not found" };
  }

  const existing = await db.facetValue.findMany({
    where: { facetId },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((v) => v.slug));

  const toCreate: { facetId: string; value: string; slug: string }[] = [];
  const skipped: string[] = [];

  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const slug = slugify(value);
    if (existingSlugs.has(slug) || toCreate.some((v) => v.slug === slug)) {
      skipped.push(value);
      continue;
    }
    toCreate.push({ facetId, value, slug });
  }

  if (toCreate.length === 0) {
    return {
      success: false as const,
      error:
        skipped.length > 0
          ? `All values already exist: ${skipped.join(", ")}`
          : "No values to create",
    };
  }

  await db.facetValue.createMany({ data: toCreate });

  revalidatePath("/dashboard/facets");
  revalidatePath("/products");

  return {
    success: true as const,
    created: toCreate.length,
    skipped,
  };
}

export async function updateFacetValue(
  id: string,
  data: Partial<FacetValueInput>
) {
  await requireAdmin();

  const facetValue = await db.facetValue.findUnique({ where: { id } });
  if (!facetValue) {
    return { success: false, error: "Facet value not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.value !== undefined) {
    updateData.value = data.value;
    updateData.slug = slugify(data.value);
    const existing = await db.facetValue.findFirst({
      where: {
        facetId: facetValue.facetId,
        slug: updateData.slug as string,
        id: { not: id },
      },
    });
    if (existing) {
      return { success: false, error: "This value already exists for this facet" };
    }
  }

  if (data.displayOrder !== undefined) {
    updateData.displayOrder = data.displayOrder;
  }

  const updated = await db.facetValue.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/dashboard/facets");
  revalidatePath("/products");

  return { success: true, value: updated };
}

export async function deleteFacetValue(id: string) {
  await requireAdmin();

  const facetValue = await db.facetValue.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!facetValue) {
    return { success: false, error: "Facet value not found" };
  }

  // Cascade delete will remove product associations
  await db.facetValue.delete({ where: { id } });

  revalidatePath("/dashboard/facets");
  revalidatePath("/products");

  return { success: true };
}
