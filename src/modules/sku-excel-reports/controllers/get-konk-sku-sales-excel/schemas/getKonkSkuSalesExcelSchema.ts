import { z } from "zod";
import { konkProdRangeSchema } from "../../../../sku-reporting/schemas/konkProdRangeSchema.js";
import { skuSalesExcelMetricsSchema } from "../../../../sku-reporting/schemas/skuSalesExcelMetricsSchema.js";

const sortBySchema = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    return val;
  },
  z.enum(["sales", "revenue"]).optional(),
);

export const getKonkSkuSalesExcelSchema = konkProdRangeSchema.and(
  z.object({
    sortBy: sortBySchema,
    metrics: skuSalesExcelMetricsSchema,
  }),
);

export type GetKonkSkuSalesExcelInput = z.infer<typeof getKonkSkuSalesExcelSchema>;
