import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { skuSelectionResolveFieldsSchema } from "../../../../sku-reporting/schemas/skuSelectionResolveSchema.js";

export const getSelectionSkusPieDataSchema = skuSelectionResolveFieldsSchema
  .and(
    z.object({
      dateFrom: dateStringSchema,
      dateTo: dateStringSchema,
    }),
  )
  .superRefine((data, ctx) => {
    if (data.dateFrom.getTime() > data.dateTo.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be before or equal to dateTo",
        path: ["dateTo"],
      });
    }
  });

export type GetSelectionSkusPieDataInput = z.infer<typeof getSelectionSkusPieDataSchema>;
