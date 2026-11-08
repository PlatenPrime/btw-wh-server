import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";

export const MAX_BATCH_CORRECT_STOCK_BAND_RANGE_DAYS = 366;
export const MAX_BATCH_CORRECT_PRODUCT_IDS = 500;

/** HTTP body (YYYY-MM-DD) or ApiTask params persisted as Date from Mongo. */
export const batchCorrectReportingDateSchema = z.union([
  dateStringSchema,
  z.date().transform((value) => toSliceDate(value)),
]);

export const batchCorrectStockBandSchema = z
  .object({
    bandId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid band ID format",
    }),
    dateFrom: batchCorrectReportingDateSchema,
    dateTo: batchCorrectReportingDateSchema,
    productIds: z
      .array(z.string().trim().min(1))
      .min(1, "productIds must contain at least one id")
      .max(MAX_BATCH_CORRECT_PRODUCT_IDS),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.dateFrom.getTime() > data.dateTo.getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "dateFrom must be before or equal to dateTo",
        path: ["dateTo"],
      });
      return;
    }
    const days = enumerateSliceDates(data.dateFrom, data.dateTo);
    if (days.length > MAX_BATCH_CORRECT_STOCK_BAND_RANGE_DAYS) {
      ctx.addIssue({
        code: "custom",
        message: `date range must be at most ${MAX_BATCH_CORRECT_STOCK_BAND_RANGE_DAYS} days`,
        path: ["dateTo"],
      });
    }
    const unique = new Set(data.productIds);
    if (unique.size !== data.productIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "productIds must be unique",
        path: ["productIds"],
      });
    }
  });

export type BatchCorrectStockBandInput = z.infer<typeof batchCorrectStockBandSchema>;
