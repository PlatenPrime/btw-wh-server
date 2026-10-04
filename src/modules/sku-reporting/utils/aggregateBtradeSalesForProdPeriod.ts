import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../slices/utils/salesComparisonUtils.js";
import { Art } from "../../arts/models/Art.js";
import type { IBtradeSliceDataItem } from "../../btrade-slices/models/BtradeSlice.js";
import {
  aggregateBtradeSlices,
  sliceDataProjectForArtikulList,
} from "../../btrade-slices/utils/btradeSliceAggregationStages.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "./coalesceSkuSliceItemsForReporting.js";
import { enumerateReportingDates } from "./skugrReporting.js";

export type AggregateBtradeSalesForProdPeriodInput = {
  dateFrom: Date;
  dateTo: Date;
  /**
   * Case-insensitive match Art.prodName === prod.
   * Ignored when `prodNamesLower` is non-empty (skugrIds path).
   */
  prod?: string;
  /** Lowercased trimmed prodNames from resolved SKUs (skugrIds filter). */
  prodNamesLower?: string[];
};

export type AggregateBtradeSalesForProdPeriodResult =
  | { ok: true; salesPcs: number; salesUah: number }
  | { ok: false };

/**
 * Сумма продаж/выручки Btrade за период по Art с нужным prodName.
 * Те же правила, что btrade-ветка в `loadKonkProdSkuChartSeries`.
 */
export async function aggregateBtradeSalesForProdPeriod(
  input: AggregateBtradeSalesForProdPeriodInput,
): Promise<AggregateBtradeSalesForProdPeriodResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const prodNamesLower = (input.prodNamesLower ?? [])
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const artFilter =
    prodNamesLower.length > 0
      ? {
          $expr: {
            $in: [
              {
                $toLower: {
                  $trim: { input: { $ifNull: ["$prodName", ""] } },
                },
              },
              prodNamesLower,
            ],
          },
        }
      : input.prod !== undefined && input.prod.trim() !== ""
        ? {
            $expr: {
              $eq: [
                {
                  $toLower: {
                    $trim: { input: { $ifNull: ["$prodName", ""] } },
                  },
                },
                input.prod.trim().toLowerCase(),
              ],
            },
          }
        : null;

  if (!artFilter) return { ok: false };

  const arts = await Art.find(artFilter).select("artikul").lean();
  const allowedArtikuls: string[] = [];
  const seenArt = new Set<string>();
  for (const a of arts) {
    const ak = (a.artikul ?? "").trim();
    if (!ak || seenArt.has(ak)) continue;
    seenArt.add(ak);
    allowedArtikuls.push(ak);
  }

  if (allowedArtikuls.length === 0) return { ok: false };

  const warmupStart = sliceDateMinusDays(dateFrom, 1);
  const fullDates = enumerateReportingDates(warmupStart, dateTo);
  const dates = enumerateReportingDates(dateFrom, dateTo);
  const dayCount = dates.length;
  if (dayCount === 0) return { ok: false };
  const reportOffset = fullDates.length - dayCount;

  const sliceRows = await aggregateBtradeSlices<{
    date: Date;
    data?: unknown;
  }>([
    {
      $match: {
        date: { $gte: warmupStart, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForArtikulList(allowedArtikuls),
  ]);

  const byDate = new Map<number, Record<string, IBtradeSliceDataItem>>();
  for (const row of sliceRows) {
    const t = toSliceDate(row.date).getTime();
    byDate.set(t, (row.data ?? {}) as Record<string, IBtradeSliceDataItem>);
  }

  let salesPcs = 0;
  let salesUah = 0;

  for (const artikul of allowedArtikuls) {
    const stocksFull: (number | null)[] = fullDates.map((d) => {
      const rec = byDate.get(toSliceDate(d).getTime());
      const item = rec?.[artikul];
      if (!item) return null;
      const q = item.quantity;
      return typeof q === "number" && Number.isFinite(q) ? q : null;
    });

    const salesSeq = computeSalesFromStockSequence(stocksFull).slice(reportOffset);

    for (let d = 0; d < dayCount; d++) {
      const item = byDate.get(toSliceDate(dates[d]!).getTime())?.[artikul];
      const sales = salesSeq[d]!.sales;
      const price = item?.price;
      const p =
        typeof price === "number" && Number.isFinite(price) ? price : null;
      salesPcs += sales;
      salesUah += computeRevenueForDay(sales, p);
    }
  }

  return {
    ok: true,
    salesPcs,
    salesUah: Math.round(salesUah * 100) / 100,
  };
}
