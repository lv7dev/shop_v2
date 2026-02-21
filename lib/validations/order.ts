import { z } from "zod";

export const cartItemInputSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  variantId: z.string().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemInputSchema).min(1, "Cart is empty"),
  addressId: z.string().optional(),
  note: z.string().max(1000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
