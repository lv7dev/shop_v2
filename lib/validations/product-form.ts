import { z } from "zod";

/**
 * Client-side product form schema for react-hook-form.
 * All fields are required strings (no optional) to match RHF's defaultValues.
 * Number fields are strings here (HTML inputs return strings),
 * then coerced to numbers before sending to the server action.
 */
export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(5000),
  price: z.string().min(1, "Price is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    "Price must be a valid number (0 or greater)"
  ),
  comparePrice: z.string(),
  sku: z.string().max(100),
  stock: z.string(),
  categoryId: z.string(),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Convert form values (strings) to the shape expected by the server action.
 */
export function formValuesToProductInput(
  values: ProductFormValues,
  images: string[],
  facetValueIds: string[],
) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    price: Number(values.price),
    comparePrice: values.comparePrice ? Number(values.comparePrice) : undefined,
    sku: values.sku.trim() || undefined,
    stock: Number(values.stock) || 0,
    images: images.filter((img) => img.trim()),
    isActive: values.isActive,
    categoryId: values.categoryId && values.categoryId !== "none" ? values.categoryId : undefined,
    facetValueIds,
  };
}
