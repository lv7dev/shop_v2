import { z } from "zod";

export const discountSchema = z
  .object({
    code: z
      .string()
      .min(1, "Discount code is required")
      .max(50)
      .transform((v) => v.toUpperCase().trim()),
    description: z.string().max(500).optional(),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    scope: z.enum(["ORDER", "PRODUCT"]).default("ORDER"),
    method: z.enum(["AUTO", "CODE"]).default("CODE"),
    stackable: z.boolean().default(false),
    value: z.number().min(0.01, "Value must be greater than 0"),
    minOrder: z.number().min(0).optional(),
    maxUses: z.number().int().min(1).optional(),
    isActive: z.boolean().default(true),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    productIds: z.array(z.string()).default([]),
  })
  .refine(
    (data) => !(data.type === "PERCENTAGE" && data.value > 100),
    { message: "Percentage cannot exceed 100%", path: ["value"] }
  )
  .refine(
    (data) => !(data.scope === "PRODUCT" && data.productIds.length === 0),
    {
      message: "Select at least one product for product-scoped discounts",
      path: ["productIds"],
    }
  );

export type DiscountInput = z.infer<typeof discountSchema>;

export const applyDiscountSchema = z.object({
  code: z.string().min(1, "Enter a discount code"),
});
