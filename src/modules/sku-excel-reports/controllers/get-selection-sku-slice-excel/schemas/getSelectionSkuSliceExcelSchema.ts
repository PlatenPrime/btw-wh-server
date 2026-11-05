import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { includeImagesSchema } from "../../../../sku-reporting/schemas/includeImagesSchema.js";
import { skuSelectionResolveFieldsSchema } from "../../../../sku-reporting/schemas/skuSelectionResolveSchema.js";
import { skuStockExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuStockExcelMetricsSchema.js";

export const getSelectionSkuSliceExcelSchema = skuSelectionResolveFieldsSchema
  .and(
    z.object({
      dateFrom: dateStringSchema,
      dateTo: dateStringSchema,
      metrics: skuStockExcelMetricsSchema,
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

export type GetSelectionSkuSliceExcelInput = z.infer<typeof getSelectionSkuSliceExcelSchema>;
