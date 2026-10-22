import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";

const MAX_CORRECT_RANGE_DAYS = 366;

export const correctBalunBandSpikeSchema = z
  .object({
    skuId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid sku ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    apply: z.boolean().optional().default(false),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.dateFrom.getTime() > data.dateTo.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be before or equal to dateTo",
        path: ["dateTo"],
      });
      return;
    }
    const days = enumerateSliceDates(data.dateFrom, data.dateTo);
    if (days.length > MAX_CORRECT_RANGE_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `date range must be at most ${MAX_CORRECT_RANGE_DAYS} days`,
        path: ["dateTo"],
      });
    }
  });

export type CorrectBalunBandSpikeInput = z.infer<typeof correctBalunBandSpikeSchema>;

export { MAX_CORRECT_RANGE_DAYS };
