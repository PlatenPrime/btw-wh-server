import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";

export const MAX_CORRECT_BAND_SPIKE_RANGE_DAYS = 366;

const stockBoundSchema = z.number().finite().nonnegative();

export const correctBandSpikeSchema = z
  .object({
    skuId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid sku ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    stockMin: stockBoundSchema,
    stockMax: stockBoundSchema,
    apply: z.boolean().optional().default(false),
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
    if (data.dateFrom.getTime() > data.dateTo.getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "dateFrom must be before or equal to dateTo",
        path: ["dateTo"],
      });
      return;
    }
    const days = enumerateSliceDates(data.dateFrom, data.dateTo);
    if (days.length > MAX_CORRECT_BAND_SPIKE_RANGE_DAYS) {
      ctx.addIssue({
        code: "custom",
        message: `date range must be at most ${MAX_CORRECT_BAND_SPIKE_RANGE_DAYS} days`,
        path: ["dateTo"],
      });
    }
  });

export type CorrectBandSpikeInput = z.infer<typeof correctBandSpikeSchema>;
