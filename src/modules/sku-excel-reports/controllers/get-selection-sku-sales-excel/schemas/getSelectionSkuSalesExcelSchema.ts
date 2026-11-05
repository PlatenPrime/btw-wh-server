import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { includeImagesSchema } from "../../../../sku-reporting/schemas/includeImagesSchema.js";
import { skuSelectionResolveFieldsSchema } from "../../../../sku-reporting/schemas/skuSelectionResolveSchema.js";
import { skuSalesExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuSalesExcelMetricsSchema.js";

export const getSelectionSkuSalesExcelSchema = skuSelectionResolveFieldsSchema
  .and(
    z.object({
      dateFrom: dateStringSchema,
      dateTo: dateStringSchema,
      metrics: skuSalesExcelMetricsSchema,
      includeImages: includeImagesSchema,
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

export type GetSelectionSkuSalesExcelInput = z.infer<typeof getSelectionSkuSalesExcelSchema>;
