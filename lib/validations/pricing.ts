import { z } from "zod";

export const pricingSettingsSchema = z.object({
  vndToUsdRate: z.number().min(1).max(1_000_000),
});
