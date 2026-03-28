import { z } from "zod";

export const getYuminStockSchema = z.object({
  link: z.string().min(1, "Link is required").url("Invalid URL"),
});

export type GetYuminStockInput = z.infer<typeof getYuminStockSchema>;
