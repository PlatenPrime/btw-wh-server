import { Sku } from "../../../../skus/models/Sku.js";
import {
  mapSliceDocsToRangeItems,
  type SliceRangeItem,
} from "../../../../slices/utils/mapSliceDocsToRangeItems.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForSingleProductId,
} from "../../../utils/sliceDataAggregationStages.js";
import type { GetSkuSliceRangeInput } from "../schemas/getSkuSliceRangeSchema.js";

export type SkuSliceRangeItem = SliceRangeItem;

export type GetSkuSliceRangeResult =
  | { ok: true; data: SkuSliceRangeItem[] }
  | { ok: false };

function sliceDateMinusDays(sliceDate: Date, days: number): Date {
  const d = new Date(sliceDate);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export async function getSkuSliceRangeUtil(
  input: GetSkuSliceRangeInput
): Promise<GetSkuSliceRangeResult> {
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

  return {
    ok: true,
    data: mapSliceDocsToRangeItems(docs, productKey, { dateFrom, dateTo }),
  };
}
