import { z } from "zod";
import { normalizeCompetitorName } from "../../../../slices/config/excludedCompetitors.js";

export const createSkuStockBandSchema = z
  .object({
    konkName: z
      .string()
      .min(1, "konkName is required")
      .transform((value) => normalizeCompetitorName(value))
      .refine((value) => value.length > 0, { message: "konkName is required" }),
    stockMin: z.number().finite().nonnegative(),
    stockMax: z.number().finite().nonnegative(),
    normalMax: z.number().finite().nonnegative(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.stockMin > data.stockMax) {
      ctx.addIssue({
        code: "custom",
        message: "stockMin must be less than or equal to stockMax",
        path: ["stockMax"],
      });
    }
    if (!(data.normalMax < data.stockMin)) {
      ctx.addIssue({
        code: "custom",
        message: "normalMax must be less than stockMin",
        path: ["normalMax"],
      });
    }
  });

export type CreateSkuStockBandInput = z.infer<typeof createSkuStockBandSchema>;
