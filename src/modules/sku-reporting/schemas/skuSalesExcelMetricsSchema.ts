import { z } from "zod";

export const SKU_SALES_EXCEL_METRICS = ["sales", "price", "revenue"] as const;
export type SkuSalesExcelMetric = (typeof SKU_SALES_EXCEL_METRICS)[number];

const metricEnum = z.enum(SKU_SALES_EXCEL_METRICS);

const CANONICAL_ORDER: readonly SkuSalesExcelMetric[] = SKU_SALES_EXCEL_METRICS;

function toCanonicalOrder(
  metrics: readonly SkuSalesExcelMetric[],
): SkuSalesExcelMetric[] {
  const selected = new Set(metrics);
  return CANONICAL_ORDER.filter((m) => selected.has(m));
}

/**
 * Опциональный список метрик sales Excel: CSV (`metrics=sales,revenue`) или массив
 * (`metrics[]=sales&metrics[]=revenue`). Пустой/отсутствующий → undefined (все метрики).
 * После парсинга — уникальные значения в каноническом порядке: sales → price → revenue.
 */
export const skuSalesExcelMetricsSchema = z.preprocess((raw) => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const parts: string[] = Array.isArray(raw)
    ? raw.flatMap((v) => (typeof v === "string" ? v.split(",") : []))
    : typeof raw === "string"
      ? raw.split(",")
      : [];
  const trimmed = parts.map((s) => s.trim()).filter((s) => s.length > 0);
  if (trimmed.length === 0) return undefined;
  return trimmed;
}, z.array(metricEnum).min(1).optional().transform((arr) => {
  if (arr === undefined) return undefined;
  return toCanonicalOrder(arr);
}));

export type SkuSalesExcelMetricsInput = z.infer<typeof skuSalesExcelMetricsSchema>;
