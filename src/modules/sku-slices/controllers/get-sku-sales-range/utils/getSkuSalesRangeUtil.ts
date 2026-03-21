import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
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

  const docs = await SkuSlice.find({
    konkName: sku.konkName,
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .sort({ date: 1 })
    .lean();

  const sliceItems: { date: string; stock: number; price: number }[] = [];
  for (const doc of docs) {
    const dataRecord = (doc.data ?? {}) as Record<string, ISkuSliceDataItem>;
    const item = dataRecord[productKey];
    if (!item) continue;
    sliceItems.push({
      date: doc.date.toISOString(),
      stock: item.stock,
      price: item.price,
    });
  }

  const stockByDay = sliceItems.map((d) => d.stock);
  const salesResults = computeSalesFromStockSequence(stockByDay);

  const data: SkuSalesRangeItem[] = sliceItems.map((d, i) => {
    const dayResult = salesResults[i]!;
    const revenue = computeRevenueForDay(dayResult.sales, d.price);
    return {
      date: d.date,
      sales: dayResult.sales,
      revenue,
      price: d.price,
      isDeliveryDay: dayResult.isDeliveryDay,
    };
  });

  return { ok: true, data };
}
