import { z } from "zod";

export const shippingSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
});

export type ShippingInput = z.infer<typeof shippingSchema>;

export const paymentMethodSchema = z.enum(["COD", "STRIPE", "MOMO"]);
export type PaymentMethodType = z.infer<typeof paymentMethodSchema>;

export const checkoutSchema = z.object({
  shipping: shippingSchema,
  note: z.string().max(1000).optional(),
  paymentMethod: paymentMethodSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
