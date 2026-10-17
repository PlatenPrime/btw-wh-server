import { Konk } from "../../konks/models/Konk.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { loadSkuSliceRowsForKonksProducts } from "../../sku-slices/utils/sliceDataAggregationStages.js";
import { sliceDateMinusDays } from "./coalesceSkuSliceItemsForReporting.js";
import {
  buildSliceMapsByKonk,
  enumerateReportingDates,
  type SliceMapsByKonk,
} from "./skugrReporting.js";

export type SkuRowForSliceMetrics = {
  konkName: string;
  productId: string;
};

export type SkuSliceSalesComputeContext = {
  maps: SliceMapsByKonk;
  datesFull: Date[];
  /** Индекс первого дня периода в datesFull (после warmup). */
  indexStart: number;
  /** Дни отчётного периода [dateFrom .. dateTo]. */
  dates: Date[];
  recountDaysByKonk: Map<string, Set<string>>;
};

/**
 * Общий preload для daily/period sku-slice sales: months + recountDays + даты.
 */
export async function loadSkuSliceSalesComputeContext(
  skus: SkuRowForSliceMetrics[],
  dateFrom: Date,
  dateTo: Date,
): Promise<{ ok: true; ctx: SkuSliceSalesComputeContext } | { ok: false }> {
  if (skus.length === 0) return { ok: false };

  const konkNames = [...new Set(skus.map((s) => s.konkName))];
  const warmupStart = sliceDateMinusDays(dateFrom, 1);

  const sliceDocs = await loadSkuSliceRowsForKonksProducts(skus, warmupStart, dateTo);

  const maps = buildSliceMapsByKonk(sliceDocs);
  const datesFull = enumerateReportingDates(warmupStart, dateTo);
  const indexStart = datesFull.findIndex(
    (d) => toSliceDate(d).getTime() >= toSliceDate(dateFrom).getTime(),
  );
  if (indexStart < 0 || indexStart >= datesFull.length) return { ok: false };

  const dates = datesFull.slice(indexStart);
  const konkDocs = await Konk.find({ name: { $in: konkNames } })
    .select("name recountDays")
    .lean();
  const recountDaysByKonk = new Map<string, Set<string>>();
  for (const doc of konkDocs) {
    recountDaysByKonk.set(doc.name, new Set((doc.recountDays ?? []).map(String)));
  }

  return {
    ok: true,
    ctx: {
      maps,
      datesFull,
      indexStart,
      dates,
      recountDaysByKonk,
    },
  };
}
