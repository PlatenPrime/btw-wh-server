import mongoose from "mongoose";
import { z } from "zod";
import { normalizeCompetitorName } from "../../../../slices/config/excludedCompetitors.js";

const stockBoundSchema = z.number().finite().nonnegative();

export const updateSkuStockBandByIdSchema = z
  .object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid band ID format",
    }),
    konkName: z
      .string()
      .min(1)
      .transform((value) => normalizeCompetitorName(value))
      .refine((value) => value.length > 0, { message: "konkName is required" })
      .optional(),
    stockMin: stockBoundSchema.optional(),
    stockMax: stockBoundSchema.optional(),
    normalMax: stockBoundSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasBounds =
      data.stockMin !== undefined || data.stockMax !== undefined || data.normalMax !== undefined;
    if (!hasBounds && data.konkName === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required",
        path: [],
      });
    }
  });

export type UpdateSkuStockBandByIdInput = z.infer<typeof updateSkuStockBandByIdSchema>;
