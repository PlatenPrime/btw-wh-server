import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { enumerateReportingDates } from "../../../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";

export const POST_CORRECTIONS_MAX_RANGE_DAYS = 31;

/** HTTP body (YYYY-MM-DD) or ApiTask params persisted as Date from Mongo. */
export const postCorrectionReportingDateSchema = z.union([
  dateStringSchema,
  z.date().transform((value) => toSliceDate(value)),
]);

export const postSkuSlicePostCorrectionsSchema = z
  .object({
    dateFrom: postCorrectionReportingDateSchema,
    dateTo: postCorrectionReportingDateSchema,
    apply: z.boolean().optional().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    const from = toSliceDate(value.dateFrom);
    const to = toSliceDate(value.dateTo);
    if (from.getTime() > to.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be on or before dateTo",
        path: ["dateFrom"],
      });
      return;
    }
    const dayCount = enumerateReportingDates(from, to).length;
    if (dayCount > POST_CORRECTIONS_MAX_RANGE_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `date range must not exceed ${POST_CORRECTIONS_MAX_RANGE_DAYS} days`,
        path: ["dateTo"],
      });
    }
  });

export type PostSkuSlicePostCorrectionsInput = z.infer<
  typeof postSkuSlicePostCorrectionsSchema
>;
