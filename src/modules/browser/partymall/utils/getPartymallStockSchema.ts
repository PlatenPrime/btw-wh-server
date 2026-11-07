import { z } from "zod";

export const getPartymallStockSchema = z.object({
  link: z.string().min(1, "Link is required").url("Invalid URL"),
});

export type GetPartymallStockInput = z.infer<typeof getPartymallStockSchema>;
