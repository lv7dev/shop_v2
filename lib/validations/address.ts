import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
