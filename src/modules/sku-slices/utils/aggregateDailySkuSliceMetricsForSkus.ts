import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../analog-slices/controllers/common/salesComparisonUtils.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  aggregateSkuSlices,
  type SliceAggregateRowWithKonk,
  sliceDataProjectForProductIdList,
} from "./sliceDataAggregationStages.js";
import {
  coalesceSkuSliceItemsAlongDates,
  sliceDateMinusDays,
} from "./coalesceSkuSliceItemsForReporting.js";
import {
  buildSliceMapsByKonk,
  enumerateReportingDates,
  getSliceItem,
} from "./skugrReporting.js";

export type DailySkuCompetitorMetricsItem = {
  date: string;
  stock: number;
  sales: number;
  revenue: number;
};

export type SkuRowForSliceMetrics = {
  konkName: string;
  productId: string;
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
  if (skus.length === 0) return { ok: false };

  const konkNames = [...new Set(skus.map((s) => s.konkName))];
  const allowedProductIds = [...new Set(skus.map((s) => s.productId))];

  const warmupStart = sliceDateMinusDays(dateFrom, 1);

  const sliceDocs = await aggregateSkuSlices<SliceAggregateRowWithKonk>([
    {
      $match: {
        konkName: { $in: konkNames },
        date: { $gte: warmupStart, $lte: dateTo },
      },
    },
    sliceDataProjectForProductIdList(allowedProductIds),
  ]);

  const maps = buildSliceMapsByKonk(sliceDocs);
  const datesFull = enumerateReportingDates(warmupStart, dateTo);
  const indexStart = datesFull.findIndex(
    (d) => toSliceDate(d).getTime() >= toSliceDate(dateFrom).getTime(),
  );
  if (indexStart < 0 || indexStart >= datesFull.length) return { ok: false };

  const dates = datesFull.slice(indexStart);

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
      stocks.push(c.stock);
      sales.push(seq.sales);
      revenue.push(computeRevenueForDay(seq.sales, c.price));
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
