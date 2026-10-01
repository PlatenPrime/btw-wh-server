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

function refineDateRange(
  data: { dateFrom: Date; dateTo: Date },
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[] = []
): void {
  if (data.dateFrom.getTime() > data.dateTo.getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "dateFrom must be before or equal to dateTo",
      path: [...pathPrefix, "dateTo"],
    });
    return;
  }
  const days = enumerateSliceDates(data.dateFrom, data.dateTo);
  if (days.length > MAX_PATCH_RANGE_DAYS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `date range must be at most ${MAX_PATCH_RANGE_DAYS} days`,
      path: [...pathPrefix, "dateTo"],
    });
  }
}

const dateRangeFields = {
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
};

/**
 * XOR: либо `date`, либо `dateFrom`+`dateTo`, либо `periods` (не вместе).
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
      ...dateRangeFields,
      ...stockPriceFields,
    })
    .strict()
    .superRefine((data, ctx) => {
      refineDateRange(data, ctx);
    }),
  z
    .object({
      skuId: skuIdSchema,
      periods: z
        .array(z.object(dateRangeFields).strict())
        .min(1, "periods must contain at least one range"),
      ...stockPriceFields,
    })
    .strict()
    .superRefine((data, ctx) => {
      const uniqueTimes = new Set<number>();
      for (let i = 0; i < data.periods.length; i++) {
        const period = data.periods[i];
        refineDateRange(period, ctx, ["periods", i]);
        if (period.dateFrom.getTime() > period.dateTo.getTime()) continue;
        for (const day of enumerateSliceDates(period.dateFrom, period.dateTo)) {
          uniqueTimes.add(day.getTime());
        }
      }
      if (uniqueTimes.size > MAX_PATCH_RANGE_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `total unique days across periods must be at most ${MAX_PATCH_RANGE_DAYS}`,
          path: ["periods"],
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

export type PatchSkuSliceByDatePeriodsInput = Extract<
  PatchSkuSliceInput,
  { periods: { dateFrom: Date; dateTo: Date }[] }
>;

export function isPatchSkuSlicePeriodsInput(
  input: PatchSkuSliceInput
): input is PatchSkuSliceByDatePeriodsInput {
  return "periods" in input;
}

export function isPatchSkuSliceRangeInput(
  input: PatchSkuSliceInput
): input is PatchSkuSliceByDateRangeInput {
  return "dateFrom" in input && "dateTo" in input && !("periods" in input);
}

export { MAX_PATCH_RANGE_DAYS };
