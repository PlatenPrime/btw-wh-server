import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { includeImagesSchema } from "../../../../sku-reporting/schemas/includeImagesSchema.js";
import { skuStockExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuStockExcelMetricsSchema.js";

export const getSkugrSliceExcelSchema = z
  .object({
    skugrId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid skugr ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    metrics: skuStockExcelMetricsSchema,
    includeImages: includeImagesSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetSkugrSliceExcelInput = z.infer<typeof getSkugrSliceExcelSchema>;
