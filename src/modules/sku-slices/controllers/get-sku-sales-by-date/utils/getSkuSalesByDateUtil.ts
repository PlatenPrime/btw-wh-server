import { Sku } from "../../../../skus/models/Sku.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForSingleProductId,
} from "../../../utils/sliceDataAggregationStages.js";
import {
  coalesceSkuSliceItemsAlongDates,
  sliceDateMinusDays,
} from "../../../utils/coalesceSkuSliceItemsForReporting.js";
import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { enumerateReportingDates } from "../../../utils/skugrReporting.js";
import type { GetSkuSalesByDateInput } from "../schemas/getSkuSalesByDateSchema.js";

export type SkuSalesByDateResult = {
  sales: number;
  revenue: number;
  price: number;
  isDeliveryDay: boolean;
};

export async function getSkuSalesByDateUtil(
  input: GetSkuSalesByDateInput
): Promise<SkuSalesByDateResult | null> {
  const sku = await Sku.findById(input.skuId).select("konkName productId").lean();

  if (!sku) return null;

  const productKey = sku.productId?.trim();
  if (!productKey) return null;

  const sliceDate = toSliceDate(input.date);
  const prevDate = sliceDateMinusDays(sliceDate, 1);
  const warmStart = sliceDateMinusDays(sliceDate, 31);

  const currRows = await aggregateSkuSlices([
    { $match: { konkName: sku.konkName, date: sliceDate } },
    { $limit: 1 },
    sliceDataProjectForSingleProductId(productKey),
  ]);

  const currDoc = currRows[0];
  const currData = (currDoc?.data ?? {}) as Record<string, ISkuSliceDataItem>;
  const currItem = currData[productKey];
  if (!currItem) return null;

  const rangeRows = await aggregateSkuSlices([
    {
      $match: {
        konkName: sku.konkName,
        date: { $gte: warmStart, $lte: sliceDate },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForSingleProductId(productKey),
  ]);

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const doc of rangeRows) {
    byDate.set(
      toSliceDate(doc.date).getTime(),
      (doc.data ?? {}) as Record<string, ISkuSliceDataItem>
    );
  }

  const datesFull = enumerateReportingDates(warmStart, sliceDate);
  const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) => {
    const rec = byDate.get(toSliceDate(d).getTime());
    return rec?.[productKey];
  });

  const tPrev = toSliceDate(prevDate).getTime();
  const tCurr = toSliceDate(sliceDate).getTime();
  const idxPrev = datesFull.findIndex((d) => toSliceDate(d).getTime() === tPrev);
  const idxCurr = datesFull.findIndex((d) => toSliceDate(d).getTime() === tCurr);
  if (idxCurr < 0) return null;

  const prevStock = idxPrev >= 0 ? coalesced[idxPrev]!.stock : null;
  const currStock = coalesced[idxCurr]!.stock;
  const stockByDay = [prevStock, currStock];
  const salesResults = computeSalesFromStockSequence(stockByDay);
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
