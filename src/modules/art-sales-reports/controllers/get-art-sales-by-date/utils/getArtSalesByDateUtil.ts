import type { IBtradeSliceDataItem } from "../../../../btrade-slices/models/BtradeSlice.js";
import {
  aggregateBtradeSlices,
  sliceDataProjectForArtikulList,
} from "../../../../btrade-slices/utils/btradeSliceAggregationStages.js";
import {
  btradeSliceDateMinusDays,
  coalesceBtradeSliceItemsAlongDates,
} from "../../../../art-reporting/utils/coalesceBtradeSliceItemsForReporting.js";
import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../../../slices/utils/salesComparisonUtils.js";
import { enumerateReportingDates } from "../../../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Art } from "../../../../arts/models/Art.js";
import type { GetArtSalesByDateInput } from "../schemas/getArtSalesByDateSchema.js";

export type ArtSalesByDateResult = {
  sales: number;
  revenue: number;
  price: number;
  isDeliveryDay: boolean;
};

export async function getArtSalesByDateUtil(
  input: GetArtSalesByDateInput,
): Promise<ArtSalesByDateResult | null> {
  const artikulKey = input.artikul.trim();
  const art = await Art.findOne({ artikul: artikulKey }).select("_id").lean();
  if (!art) return null;

  const sliceDate = toSliceDate(input.date);
  const prevDate = btradeSliceDateMinusDays(sliceDate, 1);
  const warmStart = btradeSliceDateMinusDays(sliceDate, 31);

  const currRows = await aggregateBtradeSlices([
    { $match: { date: sliceDate } },
    { $limit: 1 },
    sliceDataProjectForArtikulList([artikulKey]),
  ]);

  const currDoc = currRows[0];
  const currData = (currDoc?.data ?? {}) as Record<string, IBtradeSliceDataItem>;
  const currItem = currData[artikulKey];
  if (!currItem) return null;

  const rangeRows = await aggregateBtradeSlices([
    {
      $match: {
        date: { $gte: warmStart, $lte: sliceDate },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForArtikulList([artikulKey]),
  ]);

  const byDate = new Map<number, Record<string, IBtradeSliceDataItem>>();
  for (const doc of rangeRows) {
    byDate.set(
      toSliceDate(doc.date).getTime(),
      (doc.data ?? {}) as Record<string, IBtradeSliceDataItem>,
    );
  }

  const datesFull = enumerateReportingDates(warmStart, sliceDate);
  const coalesced = coalesceBtradeSliceItemsAlongDates(datesFull, (d) => {
    const rec = byDate.get(toSliceDate(d).getTime());
    return rec?.[artikulKey];
  });

  const tPrev = toSliceDate(prevDate).getTime();
  const tCurr = toSliceDate(sliceDate).getTime();
  const idxPrev = datesFull.findIndex((d) => toSliceDate(d).getTime() === tPrev);
  const idxCurr = datesFull.findIndex((d) => toSliceDate(d).getTime() === tCurr);
  if (idxCurr < 0) return null;

  const prevQuantity = idxPrev >= 0 ? coalesced[idxPrev]!.quantity : null;
  const currQuantity = coalesced[idxCurr]!.quantity;
  const quantityByDay = [prevQuantity, currQuantity];
  const salesResults = computeSalesFromStockSequence(quantityByDay);
  const dayResult = salesResults[1]!;
  const coalescedPrice = coalesced[idxCurr]!.price;
  const revenue = computeRevenueForDay(dayResult.sales, coalescedPrice);
  const price =
    typeof coalescedPrice === "number" && Number.isFinite(coalescedPrice)
      ? coalescedPrice
      : 0;

  return {
    sales: dayResult.sales,
    revenue,
    price,
    isDeliveryDay: dayResult.isDeliveryDay,
  };
}
