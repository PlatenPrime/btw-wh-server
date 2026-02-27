import { z } from "zod";

export const getYumiStockSchema = z.object({
  link: z.string().min(1, "Link is required").url("Invalid URL"),
});

export type GetYumiStockInput = z.infer<typeof getYumiStockSchema>;

