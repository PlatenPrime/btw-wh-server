import { Art } from "../../arts/models/Art.js";
import type { IBtradeSliceDataItem } from "../../btrade-slices/models/BtradeSlice.js";
import {
  aggregateBtradeSlices,
  sliceDataProjectForArtikulList,
} from "../../btrade-slices/utils/btradeSliceAggregationStages.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../slices/utils/salesComparisonUtils.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  btradeSliceDateMinusDays,
  coalesceBtradeSliceItemsAlongDates,
  type BtradeReportingCoalescedPoint,
} from "./coalesceBtradeSliceItemsForReporting.js";

export type ArtBtradeSliceSeriesLoad = {
  ok: true;
  artikul: string;
  artNameUkr: string | null;
  datesReport: Date[];
  coalescedReport: BtradeReportingCoalescedPoint[];
  /** Индекс первого дня отчёта в coalescedFull (после warm day). */
  reportIndexStart: number;
  coalescedFull: BtradeReportingCoalescedPoint[];
};

export type LoadArtBtradeSliceSeriesResult =
  | ArtBtradeSliceSeriesLoad
  | { ok: false };

export type ArtBtradeSalesPoint = {
  date: string;
  sales: number;
  revenue: number;
  price: number;
  isDeliveryDay: boolean;
};

export type LoadArtBtradeSliceSeriesInput = {
  artikul: string;
  dateFrom: Date;
  dateTo: Date;
};

export async function loadArtBtradeSliceSeries(
  input: LoadArtBtradeSliceSeriesInput,
): Promise<LoadArtBtradeSliceSeriesResult> {
  const artikulKey = input.artikul.trim();
  if (!artikulKey) return { ok: false };

  const artDoc = await Art.findOne({ artikul: artikulKey })
    .select("nameukr")
    .lean();
  if (!artDoc) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const warmStart = btradeSliceDateMinusDays(dateFrom, 1);

  const sliceRows = await aggregateBtradeSlices<{ date: Date; data?: unknown }>(
    [
      {
        $match: {
          date: { $gte: warmStart, $lte: dateTo },
        },
      },
      { $sort: { date: 1 } },
      sliceDataProjectForArtikulList([artikulKey]),
    ],
  );

  const byDate = new Map<number, Record<string, IBtradeSliceDataItem>>();
  for (const row of sliceRows) {
    byDate.set(
      toSliceDate(row.date).getTime(),
      (row.data ?? {}) as Record<string, IBtradeSliceDataItem>,
    );
  }

  const datesFull = enumerateReportingDates(warmStart, dateTo);
  const indexStart = datesFull.findIndex(
    (d) => toSliceDate(d).getTime() >= toSliceDate(dateFrom).getTime(),
  );
  if (indexStart < 0) return { ok: false };

  const coalesced = coalesceBtradeSliceItemsAlongDates(datesFull, (d) => {
    const rec = byDate.get(toSliceDate(d).getTime());
    return rec?.[artikulKey];
  });

  const datesReport = datesFull.slice(indexStart);
  const coalescedReport = coalesced.slice(indexStart);

  return {
    ok: true,
    artikul: artikulKey,
    artNameUkr: (artDoc.nameukr ?? "").trim() || null,
    datesReport,
    coalescedReport,
    reportIndexStart: indexStart,
    coalescedFull: coalesced,
  };
}

export function computeArtSalesPointsFromSeries(
  datesReport: Date[],
  coalescedFull: BtradeReportingCoalescedPoint[],
  reportIndexStart: number,
): ArtBtradeSalesPoint[] {
  const quantityByDay = coalescedFull.map((c) => c.quantity);
  const salesResults = computeSalesFromStockSequence(quantityByDay);

  return datesReport.map((d, i) => {
    const idx = reportIndexStart + i;
    const dayResult = salesResults[idx]!;
    const priceVal = coalescedFull[idx]!.price;
    const sales = dayResult.sales;
    const revenue = computeRevenueForDay(sales, priceVal);
    const price =
      typeof priceVal === "number" && Number.isFinite(priceVal) ? priceVal : 0;
    return {
      date: d.toISOString(),
      sales,
      revenue,
      price,
      isDeliveryDay: dayResult.isDeliveryDay,
    };
  });
}

export function quantityForChart(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
