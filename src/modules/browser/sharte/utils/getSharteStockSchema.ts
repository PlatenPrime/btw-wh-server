import { z } from "zod";

export const getSharteStockSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  url: z.union([z.string().url(), z.literal("")]).optional(),
});

export type GetSharteStockInput = z.infer<typeof getSharteStockSchema>;
