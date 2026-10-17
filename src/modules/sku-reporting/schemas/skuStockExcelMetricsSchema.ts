import { z } from "zod";

export const SKU_STOCK_EXCEL_METRICS = ["stock", "price"] as const;
export type SkuStockExcelMetric = (typeof SKU_STOCK_EXCEL_METRICS)[number];

const metricEnum = z.enum(SKU_STOCK_EXCEL_METRICS);

const CANONICAL_ORDER: readonly SkuStockExcelMetric[] = SKU_STOCK_EXCEL_METRICS;

function toCanonicalOrder(metrics: readonly SkuStockExcelMetric[]): SkuStockExcelMetric[] {
  const selected = new Set(metrics);
  return CANONICAL_ORDER.filter((m) => selected.has(m));
}

/**
 * Опциональный список метрик stock Excel: CSV (`metrics=stock,price`) или массив
 * (`metrics[]=stock&metrics[]=price`). Пустой/отсутствующий → undefined (все метрики).
 * После парсинга — уникальные значения в каноническом порядке: stock → price.
 */
export const skuStockExcelMetricsSchema = z.preprocess(
  (raw) => {
    if (raw === undefined || raw === null || raw === "") return undefined;
    const parts: string[] = Array.isArray(raw)
      ? raw.flatMap((v) => (typeof v === "string" ? v.split(",") : []))
      : typeof raw === "string"
        ? raw.split(",")
        : [];
    const trimmed = parts.map((s) => s.trim()).filter((s) => s.length > 0);
    if (trimmed.length === 0) return undefined;
    return trimmed;
  },
  z
    .array(metricEnum)
    .min(1)
    .transform((arr) => toCanonicalOrder(arr))
    .optional(),
);

export type SkuStockExcelMetricsInput = z.infer<typeof skuStockExcelMetricsSchema>;
