import { Sku } from "../../../../skus/models/Sku.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForSingleProductId,
} from "../../../utils/sliceDataAggregationStages.js";
import type { GetSkuSliceRangeInput } from "../schemas/getSkuSliceRangeSchema.js";

export type SkuSliceRangeItem = { date: string; stock: number; price: number };

export type GetSkuSliceRangeResult =
  | { ok: true; data: SkuSliceRangeItem[] }
  | { ok: false };

export async function getSkuSliceRangeUtil(
  input: GetSkuSliceRangeInput
): Promise<GetSkuSliceRangeResult> {
  const sku = await Sku.findById(input.skuId).select("konkName productId").lean();

  if (!sku) return { ok: false };

  const productKey = sku.productId?.trim();
  if (!productKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const docs = await aggregateSkuSlices([
    {
      $match: {
        konkName: sku.konkName,
        date: { $gte: dateFrom, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForSingleProductId(productKey),
  ]);

  const data: SkuSliceRangeItem[] = [];
  for (const doc of docs) {
    const dataRecord = (doc.data ?? {}) as Record<string, ISkuSliceDataItem>;
    const item = dataRecord[productKey];
    if (!item) continue;
    data.push({
      date: doc.date.toISOString(),
      stock: item.stock,
      price: item.price,
    });
  }

  return { ok: true, data };
}
