import { z } from "zod";

export const getDojdevikStockSchema = z.object({
  link: z.string().min(1, "Link is required").url("Invalid URL"),
});

export type GetDojdevikStockInput = z.infer<typeof getDojdevikStockSchema>;
