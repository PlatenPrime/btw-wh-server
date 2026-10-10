import { Sku } from "../../../../skus/models/Sku.js";
import type { ISkuSliceDataItem } from "../../../models/skuSliceTypes.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import type { PatchSkuSliceByDateInput } from "../schemas/patchSkuSliceByDateSchema.js";
import { afterSkuSliceStockMutation } from "../../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import {
  getDayPoint,
  upsertDayPoint,
} from "../../../utils/skuSliceMonthStore.js";

export type PatchSkuSliceByDateResult = {
  productId: string;
  date: Date;
  stock: number;
  price: number;
  previous: ISkuSliceDataItem | null;
  created: boolean;
};

export function readPreviousPoint(item: unknown): ISkuSliceDataItem | null {
  if (item === null || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  if (typeof o.stock !== "number" || !Number.isFinite(o.stock)) return null;
  if (typeof o.price !== "number" || !Number.isFinite(o.price)) return null;
  return { stock: o.stock, price: o.price };
}

/**
 * Перезаписывает stock/price SKU в SkuSliceMonth на дату.
 * `created` — true, если ключа дня раньше не было.
 */
export async function patchSkuSliceByDateUtil(
  input: PatchSkuSliceByDateInput,
): Promise<PatchSkuSliceByDateResult | null> {
  const sku = await Sku.findById(input.skuId)
    .select("konkName productId")
    .lean();
  if (!sku) return null;

  const productId = sku.productId?.trim();
  if (!productId) return null;

  const sliceDate = toSliceDate(input.date);
  const nextItem: ISkuSliceDataItem = {
    stock: input.stock,
    price: input.price,
  };

  const previous = await getDayPoint(sku.konkName, productId, sliceDate);
  const created = previous == null;
  await upsertDayPoint(sku.konkName, productId, sliceDate, nextItem);

  await afterSkuSliceStockMutation({
    konkName: sku.konkName,
    dayD: sliceDate,
    productIds: [productId],
  });

  return {
    productId,
    date: sliceDate,
    stock: nextItem.stock,
    price: nextItem.price,
    previous,
    created,
  };
}
