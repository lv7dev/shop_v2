import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().max(1000).optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  parentId: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const categoryUpdateSchema = categorySchema.partial();

export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
