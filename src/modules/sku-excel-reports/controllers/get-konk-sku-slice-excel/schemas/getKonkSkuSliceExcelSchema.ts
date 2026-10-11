import { z } from "zod";
import { konkProdRangeSchema } from "../../../../sku-reporting/schemas/konkProdRangeSchema.js";
import { skuStockExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuStockExcelMetricsSchema.js";

export const getKonkSkuSliceExcelSchema = konkProdRangeSchema.and(
  z.object({
    metrics: skuStockExcelMetricsSchema,
  }),
);

export type GetKonkSkuSliceExcelInput = z.infer<typeof getKonkSkuSliceExcelSchema>;
