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
import type { GetSkuSalesRangeInput } from "../schemas/getSkuSalesRangeSchema.js";

export type SkuSalesRangeItem = {
  date: string;
  sales: number;
  revenue: number;
  price: number;
  isDeliveryDay: boolean;
};

export type GetSkuSalesRangeResult =
  | { ok: true; data: SkuSalesRangeItem[] }
  | { ok: false };

export async function getSkuSalesRangeUtil(
  input: GetSkuSalesRangeInput
): Promise<GetSkuSalesRangeResult> {
  const sku = await Sku.findById(input.skuId).select("konkName productId").lean();

  if (!sku) return { ok: false };

  const productKey = sku.productId?.trim();
  if (!productKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const warmStart = sliceDateMinusDays(dateFrom, 1);

  const docs = await aggregateSkuSlices([
    {
      $match: {
        konkName: sku.konkName,
        date: { $gte: warmStart, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForSingleProductId(productKey),
  ]);

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const doc of docs) {
    byDate.set(
      toSliceDate(doc.date).getTime(),
      (doc.data ?? {}) as Record<string, ISkuSliceDataItem>
    );
  }

  const datesFull = enumerateReportingDates(warmStart, dateTo);
  const indexStart = datesFull.findIndex(
    (d) => toSliceDate(d).getTime() >= toSliceDate(dateFrom).getTime()
  );
  if (indexStart < 0) return { ok: false };

  const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) => {
    const rec = byDate.get(toSliceDate(d).getTime());
    return rec?.[productKey];
  });

  const datesReport = datesFull.slice(indexStart);
  const coalescedReport = coalesced.slice(indexStart);
  const stockByDay = coalescedReport.map((c) => c.stock);
  const salesResults = computeSalesFromStockSequence(stockByDay);

  const data: SkuSalesRangeItem[] = datesReport.map((d, i) => {
    const dayResult = salesResults[i]!;
    const priceVal = coalescedReport[i]!.price;
    const price =
      typeof priceVal === "number" && Number.isFinite(priceVal) ? priceVal : 0;
    const revenue = computeRevenueForDay(dayResult.sales, priceVal ?? null);
    return {
      date: d.toISOString(),
      sales: dayResult.sales,
      revenue,
      price,
      isDeliveryDay: dayResult.isDeliveryDay,
    };
  });

  return { ok: true, data };
}
