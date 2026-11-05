import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { includeImagesSchema } from "../../../../sku-reporting/schemas/includeImagesSchema.js";
import { skuSalesExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuSalesExcelMetricsSchema.js";

export const getSkugrSalesExcelSchema = z
  .object({
    skugrId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid skugr ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    metrics: skuSalesExcelMetricsSchema,
    includeImages: includeImagesSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetSkugrSalesExcelInput = z.infer<typeof getSkugrSalesExcelSchema>;
