import {
  applyRecountDayToSales,
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../slices/utils/salesComparisonUtils.js";
import {
  coalesceSkuSliceItemsAlongDates,
} from "./coalesceSkuSliceItemsForReporting.js";
import {
  loadSkuSliceSalesComputeContext,
  type SkuRowForSliceMetrics,
} from "./loadSkuSliceSalesComputeContext.js";
import { getSliceItem } from "./skugrReporting.js";

export type { SkuRowForSliceMetrics };

export type DailySkuCompetitorMetricsItem = {
  date: string;
  stock: number;
  sales: number;
  revenue: number;
};

/**
 * Дневные суммы по конкуренту (SkuSlice): остаток, продажи и выручка по тем же правилам, что skugr daily-summary.
 */
export async function aggregateDailySkuSliceMetricsForSkus(
  skus: SkuRowForSliceMetrics[],
  dateFrom: Date,
  dateTo: Date,
): Promise<
  { ok: true; data: DailySkuCompetitorMetricsItem[] } | { ok: false }
> {
  const loaded = await loadSkuSliceSalesComputeContext(skus, dateFrom, dateTo);
  if (!loaded.ok) return { ok: false };
  const { maps, datesFull, indexStart, dates, recountDaysByKonk } = loaded.ctx;

  const perSku: {
    stocks: (number | null)[];
    sales: number[];
    revenue: number[];
  }[] = [];

  for (const sku of skus) {
    const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) =>
      getSliceItem(maps, sku.konkName, sku.productId, d),
    );

    const stocksFull = coalesced.map((c) => c.stock);
    const salesSeq = computeSalesFromStockSequence(stocksFull);

    const stocks: (number | null)[] = [];
    const sales: number[] = [];
    const revenue: number[] = [];
    for (let i = indexStart; i < datesFull.length; i++) {
      const c = coalesced[i]!;
      const seq = salesSeq[i]!;
      const recountDays = recountDaysByKonk.get(sku.konkName) ?? new Set<string>();
      const salesValue = applyRecountDayToSales(
        seq.sales,
        dates[i - indexStart]!,
        recountDays,
      );
      stocks.push(c.stock);
      sales.push(salesValue);
      revenue.push(computeRevenueForDay(salesValue, c.price));
    }

    perSku.push({ stocks, sales, revenue });
  }

  const data: DailySkuCompetitorMetricsItem[] = dates.map((d, dayIndex) => {
    let stock = 0;
    let sales = 0;
    let revenue = 0;
    for (const row of perSku) {
      const st = row.stocks[dayIndex];
      if (typeof st === "number" && Number.isFinite(st)) stock += st;
      sales += row.sales[dayIndex] ?? 0;
      revenue += row.revenue[dayIndex] ?? 0;
    }
    revenue = Math.round(revenue * 100) / 100;
    return {
      date: d.toISOString(),
      stock,
      sales,
      revenue,
    };
  });

  return { ok: true, data };
}
