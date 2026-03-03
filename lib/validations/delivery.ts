import { z } from "zod";

export const deliverySettingsSchema = z.object({
  hqLatitude: z.number().min(-90).max(90),
  hqLongitude: z.number().min(-180).max(180),
  hqAddress: z.string().min(1).max(200),
  simulationDurationMinutes: z.number().min(0.5).max(60),
});
