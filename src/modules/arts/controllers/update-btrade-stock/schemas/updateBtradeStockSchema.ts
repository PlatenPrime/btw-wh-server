import { z } from "zod";

export const updateBtradeStockSchema = z.object({
  artikul: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "artikul is required" : "artikul must be a string",
    })
    .min(1, "artikul cannot be empty"),
});

export type UpdateBtradeStockInput = z.infer<typeof updateBtradeStockSchema>;
