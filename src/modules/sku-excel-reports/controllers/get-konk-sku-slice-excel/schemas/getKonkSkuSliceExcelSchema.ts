import { z } from "zod";
import { includeImagesSchema } from "../../../../sku-reporting/schemas/includeImagesSchema.js";
import { konkProdRangeSchema } from "../../../../sku-reporting/schemas/konkProdRangeSchema.js";
import { skuStockExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuStockExcelMetricsSchema.js";

export const getKonkSkuSliceExcelSchema = konkProdRangeSchema.and(
  z.object({
    metrics: skuStockExcelMetricsSchema,
    includeImages: includeImagesSchema,
  }),
);

export type GetKonkSkuSliceExcelInput = z.infer<typeof getKonkSkuSliceExcelSchema>;
