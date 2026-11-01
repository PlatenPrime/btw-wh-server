import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { skuSalesExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuSalesExcelMetricsSchema.js";

const objectIdString = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid sku ID format",
});

export const getSelectionSkuSalesExcelSchema = z
  .object({
    skuIds: z.array(objectIdString).min(1).max(100),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    metrics: skuSalesExcelMetricsSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetSelectionSkuSalesExcelInput = z.infer<typeof getSelectionSkuSalesExcelSchema>;
