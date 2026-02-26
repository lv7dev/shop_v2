import { z } from "zod";

// ─── Product ──────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(5000).optional(),
  price: z.number().min(0, "Price must be 0 or greater"),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0, "Stock must be 0 or greater").default(0),
  images: z.array(z.string().url("Invalid image URL")).default([]),
  attributes: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().optional(),
  facetValueIds: z.array(z.string()).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const productUpdateSchema = productSchema.partial();

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// ─── Variant ──────────────────────────────────────────────

export const variantSchema = z.object({
  sku: z.string().max(100).optional(),
  price: z.number().min(0, "Price must be 0 or greater"),
  stock: z.number().int().min(0, "Stock must be 0 or greater").default(0),
  facetValueIds: z.array(z.string()).min(1, "Select at least one option"),
});

export type VariantInput = z.infer<typeof variantSchema>;

export const saveVariantsSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variants: z.array(variantSchema),
});
