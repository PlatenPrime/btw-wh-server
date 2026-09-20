import { Sku } from "../../../../skus/models/Sku.js";
import {
  SkuSlice,
  type ISkuSliceDataItem,
} from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import type { PatchSkuSliceByDateInput } from "../schemas/patchSkuSliceByDateSchema.js";

export type PatchSkuSliceByDateResult = {
  productId: string;
  date: Date;
  stock: number;
  price: number;
  previous: ISkuSliceDataItem | null;
};

function readPreviousPoint(item: unknown): ISkuSliceDataItem | null {
  if (item === null || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  if (typeof o.stock !== "number" || !Number.isFinite(o.stock)) return null;
  if (typeof o.price !== "number" || !Number.isFinite(o.price)) return null;
  return { stock: o.stock, price: o.price };
}

/**
 * Перезаписывает stock/price SKU в существующем документе SkuSlice на дату.
 * Документ дня не создаётся.
 */
export async function patchSkuSliceByDateUtil(
  input: PatchSkuSliceByDateInput
): Promise<PatchSkuSliceByDateResult | null> {
  const sku = await Sku.findById(input.skuId)
    .select("konkName productId")
    .lean();
  if (!sku) return null;

  const productId = sku.productId?.trim();
  if (!productId) return null;

  const sliceDate = toSliceDate(input.date);
  const slice = await SkuSlice.findOne({
    konkName: sku.konkName,
    date: sliceDate,
  })
    .select("data")
    .lean();
  if (!slice) return null;

  const previous = readPreviousPoint(
    (slice.data as Record<string, unknown> | undefined)?.[productId]
  );
  const nextItem: ISkuSliceDataItem = {
    stock: input.stock,
    price: input.price,
  };

  await SkuSlice.updateOne(
    { _id: slice._id },
    { $set: { [`data.${productId}`]: nextItem } }
  );

  return {
    productId,
    date: sliceDate,
    stock: nextItem.stock,
    price: nextItem.price,
    previous,
  };
}
