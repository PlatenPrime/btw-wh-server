import { Sku } from "../../../../skus/models/Sku.js";
import type { ISkuSliceDataItem } from "../../../../sku-slices/models/skuSliceTypes.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForSingleProductId,
} from "../../../../sku-slices/utils/sliceDataAggregationStages.js";
import {
  coalesceSkuSliceItemsAlongDates,
  isValidSkuSliceMetricValue,
  sliceDateMinusDays,
} from "../../../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import {
  applyRecountDayToSales,
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../../../slices/utils/salesComparisonUtils.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { enumerateReportingDates } from "../../../../sku-reporting/utils/skugrReporting.js";
import type { GetSkuSalesByDateInput } from "../schemas/getSkuSalesByDateSchema.js";
import { Konk } from "../../../../konks/models/Konk.js";

export type SkuSalesByDateResult = {
  sales: number;
  revenue: number;
  price: number;
  isDeliveryDay: boolean;
};

const LOOKBACK_DAYS_WHEN_HOLE = 31;

async function loadSliceDataForProduct(
  konkName: string,
  productKey: string,
  date: Date,
): Promise<Record<string, ISkuSliceDataItem>> {
  const rows = await aggregateSkuSlices([
    { $match: { konkName, date } },
    { $limit: 1 },
    sliceDataProjectForSingleProductId(productKey),
  ]);
  return (rows[0]?.data ?? {}) as Record<string, ISkuSliceDataItem>;
}

async function loadSliceDataRangeForProduct(
  konkName: string,
  productKey: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<Map<number, Record<string, ISkuSliceDataItem>>> {
  const rangeRows = await aggregateSkuSlices([
    {
      $match: {
        konkName,
        date: { $gte: dateFrom, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForSingleProductId(productKey),
  ]);

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const doc of rangeRows) {
    byDate.set(
      toSliceDate(doc.date).getTime(),
      (doc.data ?? {}) as Record<string, ISkuSliceDataItem>,
    );
  }
  return byDate;
}

function needsHoleLookback(
  prevItem: ISkuSliceDataItem | undefined,
  currItem: ISkuSliceDataItem,
): boolean {
  if (!isValidSkuSliceMetricValue(prevItem?.stock)) return true;
  if (!isValidSkuSliceMetricValue(currItem.stock)) return true;
  if (!isValidSkuSliceMetricValue(currItem.price)) return true;
  return false;
}

export async function getSkuSalesByDateUtil(
  input: GetSkuSalesByDateInput,
): Promise<SkuSalesByDateResult | null> {
  const sku = await Sku.findById(input.skuId).select("konkName productId").lean();

  if (!sku) return null;

  const productKey = sku.productId?.trim();
  if (!productKey) return null;
  const konkDoc = await Konk.findOne({ name: sku.konkName })
    .select("recountDays")
    .lean();
  const recountDays = new Set((konkDoc?.recountDays ?? []).map(String));

  const sliceDate = toSliceDate(input.date);
  const prevDate = sliceDateMinusDays(sliceDate, 1);

  const currData = await loadSliceDataForProduct(
    sku.konkName,
    productKey,
    sliceDate,
  );
  const currItem = currData[productKey];
  if (!currItem) return null;

  const prevData = await loadSliceDataForProduct(
    sku.konkName,
    productKey,
    prevDate,
  );
  const prevItem = prevData[productKey];

  let warmStart = prevDate;
  let byDate = new Map<number, Record<string, ISkuSliceDataItem>>([
    [prevDate.getTime(), prevData],
    [sliceDate.getTime(), currData],
  ]);

  if (needsHoleLookback(prevItem, currItem)) {
    warmStart = sliceDateMinusDays(sliceDate, LOOKBACK_DAYS_WHEN_HOLE);
    byDate = await loadSliceDataRangeForProduct(
      sku.konkName,
      productKey,
      warmStart,
      sliceDate,
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
  const sales = applyRecountDayToSales(dayResult.sales, sliceDate, recountDays);
  const coalescedPrice = coalesced[idxCurr]!.price;
  const revenue = computeRevenueForDay(sales, coalescedPrice);
  const price =
    typeof coalescedPrice === "number" && Number.isFinite(coalescedPrice)
      ? coalescedPrice
      : 0;

  return {
    sales,
    revenue,
    price,
    isDeliveryDay: dayResult.isDeliveryDay,
  };
}
