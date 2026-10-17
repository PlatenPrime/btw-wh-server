import {
  applyRecountDayToSales,
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../slices/utils/salesComparisonUtils.js";
import { coalesceSkuSliceItemsAlongDates } from "./coalesceSkuSliceItemsForReporting.js";
import {
  loadSkuSliceSalesComputeContext,
  type SkuRowForSliceMetrics,
} from "./loadSkuSliceSalesComputeContext.js";
import { getSliceItem } from "./skugrReporting.js";

export type PeriodSkuSliceMetricsItem = {
  salesPcs: number;
  salesUah: number;
};

/** Ключ для Map period-метрик: konkName + productId. */
export function skuSliceMetricsKey(konkName: string, productId: string): string {
  return `${konkName}\0${productId}`;
}

export function uniqueSkuRowsForSliceMetrics(
  skus: SkuRowForSliceMetrics[],
): SkuRowForSliceMetrics[] {
  const map = new Map<string, SkuRowForSliceMetrics>();
  for (const s of skus) {
    const productId = (s.productId ?? "").trim();
    if (!productId) continue;
    const key = skuSliceMetricsKey(s.konkName, productId);
    if (!map.has(key)) {
      map.set(key, { konkName: s.konkName, productId });
    }
  }
  return [...map.values()];
}

/**
 * Периодные итоги продаж/выручки по каждому SKU (порядок = входной массив).
 * Та же математика срезов, что у aggregateDailySkuSliceMetricsForSkus.
 */
export async function aggregatePeriodSkuSliceMetricsForSkus(
  skus: SkuRowForSliceMetrics[],
  dateFrom: Date,
  dateTo: Date,
): Promise<{ ok: true; data: PeriodSkuSliceMetricsItem[] } | { ok: false }> {
  const loaded = await loadSkuSliceSalesComputeContext(skus, dateFrom, dateTo);
  if (!loaded.ok) return { ok: false };
  const { maps, datesFull, indexStart, dates, recountDaysByKonk } = loaded.ctx;

  const data: PeriodSkuSliceMetricsItem[] = [];

  for (const sku of skus) {
    const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) =>
      getSliceItem(maps, sku.konkName, sku.productId, d),
    );

    const stocksFull = coalesced.map((c) => c.stock);
    const salesSeq = computeSalesFromStockSequence(stocksFull);

    let salesPcs = 0;
    let salesUah = 0;
    for (let i = indexStart; i < datesFull.length; i++) {
      const c = coalesced[i]!;
      const seq = salesSeq[i]!;
      const recountDays = recountDaysByKonk.get(sku.konkName) ?? new Set<string>();
      const salesValue = applyRecountDayToSales(seq.sales, dates[i - indexStart]!, recountDays);
      salesPcs += salesValue;
      salesUah += computeRevenueForDay(salesValue, c.price);
    }

    data.push({
      salesPcs,
      salesUah: Math.round(salesUah * 100) / 100,
    });
  }

  return { ok: true, data };
}

/**
 * Period-метрики по unique (konkName, productId) — один load для batch-отчётов.
 */
export async function aggregatePeriodSkuSliceMetricsBySkuKey(
  skus: SkuRowForSliceMetrics[],
  dateFrom: Date,
  dateTo: Date,
): Promise<{ ok: true; byKey: Map<string, PeriodSkuSliceMetricsItem> } | { ok: false }> {
  const unique = uniqueSkuRowsForSliceMetrics(skus);
  if (unique.length === 0) return { ok: false };

  const period = await aggregatePeriodSkuSliceMetricsForSkus(unique, dateFrom, dateTo);
  if (!period.ok) return { ok: false };

  const byKey = new Map<string, PeriodSkuSliceMetricsItem>();
  for (let i = 0; i < unique.length; i++) {
    const sku = unique[i]!;
    byKey.set(skuSliceMetricsKey(sku.konkName, sku.productId), period.data[i]!);
  }
  return { ok: true, byKey };
}
