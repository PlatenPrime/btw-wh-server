import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { isInvalidSliceStockResult } from "../../../../slices/utils/isInvalidSliceStockResult.js";
import { resolveSliceRotationInfo } from "../../../../slices/utils/sliceRotation.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { AIR_CLIENT_SLICE_KONK } from "../../../constants/airClientSlice.js";
import { loadSlicedSkusForKonk } from "../../../utils/loadSlicedSkusForKonk.js";
import { filterSlicedSkusForRotation } from "../../../utils/filterSlicedSkusForRotation.js";

export type AirClientPendingItem = {
  skuId: string;
  productId: string;
  title: string;
  url: string;
};

export type AirClientPendingRotation = {
  cycleDays: number;
  dayIndex: number;
  dueCount: number;
};

export type AirClientPendingResult = {
  date: Date;
  items: AirClientPendingItem[];
  rotation: AirClientPendingRotation | null;
};

function isPendingSliceItem(item: ISkuSliceDataItem | undefined): boolean {
  if (!item) return true;
  return isInvalidSliceStockResult(item);
}

/**
 * Air SKU из sliced-групп, у которых в сегодняшнем SkuSlice
 * нет записи или stock/price содержат sentinel -1.
 */
export async function getAirClientPendingUtil(
  now: Date = new Date()
): Promise<AirClientPendingResult> {
  const sliceDate = toSliceDate(now);
  const allSkus = await loadSlicedSkusForKonk(
    AIR_CLIENT_SLICE_KONK,
    "_id productId title url"
  );
  const { skus, rotation } = filterSlicedSkusForRotation(
    allSkus,
    sliceDate,
    AIR_CLIENT_SLICE_KONK
  );

  const sliceDoc = await SkuSlice.findOne({
    konkName: AIR_CLIENT_SLICE_KONK,
    date: sliceDate,
  })
    .select("data")
    .lean();

  const data = (sliceDoc?.data ?? {}) as Record<string, ISkuSliceDataItem>;
  const items: AirClientPendingItem[] = [];

  for (const sku of skus) {
    const productId = (sku.productId ?? "").trim();
    if (!productId) continue;
    const url = (sku.url ?? "").trim();
    if (!url) continue;
    if (!isPendingSliceItem(data[productId])) continue;

    items.push({
      skuId: sku._id.toString(),
      productId,
      title: (sku.title ?? "").trim(),
      url,
    });
  }

  const rotationInfo =
    rotation ??
    resolveSliceRotationInfo(AIR_CLIENT_SLICE_KONK, sliceDate);

  return {
    date: sliceDate,
    items,
    rotation: rotationInfo
      ? {
          cycleDays: rotationInfo.cycleDays,
          dayIndex: rotationInfo.dayIndex,
          dueCount: skus.length,
        }
      : null,
  };
}
