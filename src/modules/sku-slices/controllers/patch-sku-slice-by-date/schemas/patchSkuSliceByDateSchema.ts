import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";

const finiteNumberSchema = z.number().finite();

const MAX_PATCH_RANGE_DAYS = 366;

const skuIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid sku ID format",
});

const stockPriceFields = {
  stock: finiteNumberSchema,
  price: finiteNumberSchema,
};

/**
 * XOR: либо `date`, либо `dateFrom`+`dateTo` (не оба режима сразу).
 */
export const patchSkuSliceByDateSchema = z.union([
  z
    .object({
      skuId: skuIdSchema,
      date: dateStringSchema,
      ...stockPriceFields,
    })
    .strict(),
  z
    .object({
      skuId: skuIdSchema,
      dateFrom: dateStringSchema,
      dateTo: dateStringSchema,
      ...stockPriceFields,
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
      if (days.length > MAX_PATCH_RANGE_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `date range must be at most ${MAX_PATCH_RANGE_DAYS} days`,
          path: ["dateTo"],
        });
      }
    }),
]);

export type PatchSkuSliceInput = z.infer<typeof patchSkuSliceByDateSchema>;

export type PatchSkuSliceByDateInput = Extract<
  PatchSkuSliceInput,
  { date: Date }
>;

export type PatchSkuSliceByDateRangeInput = Extract<
  PatchSkuSliceInput,
  { dateFrom: Date; dateTo: Date }
>;

export function isPatchSkuSliceRangeInput(
  input: PatchSkuSliceInput
): input is PatchSkuSliceByDateRangeInput {
  return "dateFrom" in input && "dateTo" in input;
}

export { MAX_PATCH_RANGE_DAYS };
