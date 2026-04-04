import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregateDailySkuSliceMetricsForSkus } from "../../../utils/aggregateDailySkuSliceMetricsForSkus.js";
import { loadSkugrWithOrderedSkus } from "../../../utils/skugrReporting.js";
import type { GetSkugrDailySummaryInput } from "../schemas/getSkugrDailySummarySchema.js";

export type SkugrDailySummaryItem = {
  date: string;
  stock: number;
  sales: number;
  revenue: number;
};

export type GetSkugrDailySummaryResult =
  | { ok: true; data: SkugrDailySummaryItem[] }
  | { ok: false };

export async function getSkugrDailySummaryUtil(
  input: GetSkugrDailySummaryInput,
): Promise<GetSkugrDailySummaryResult> {
  const loaded = await loadSkugrWithOrderedSkus(input.skugrId);
  if (!loaded) return { ok: false };
  const { skus } = loaded;
  if (skus.length === 0) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const metrics = await aggregateDailySkuSliceMetricsForSkus(
    skus.map((s) => ({ konkName: s.konkName, productId: s.productId })),
    dateFrom,
    dateTo,
  );
  if (!metrics.ok) return { ok: false };

  return { ok: true, data: metrics.data };
}
