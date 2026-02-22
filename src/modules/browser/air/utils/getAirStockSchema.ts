import { z } from "zod";

export const getAirStockSchema = z.object({
  link: z
    .string()
    .min(1, "Link is required")
    .url("Invalid URL"),
});

export type GetAirStockInput = z.infer<typeof getAirStockSchema>;
