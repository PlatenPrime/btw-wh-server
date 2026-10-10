import { Sku } from "../../../../skus/models/Sku.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { getDayPoint } from "../../../utils/skuSliceMonthStore.js";
import type { GetSkuSliceByDateInput } from "../schemas/getSkuSliceByDateSchema.js";

export type SkuSliceByDateResult = { stock: number; price: number };

export async function getSkuSliceByDateUtil(
  input: GetSkuSliceByDateInput,
): Promise<SkuSliceByDateResult | null> {
  const sku = await Sku.findById(input.skuId).select("konkName productId").lean();

  if (!sku) return null;

  const productKey = sku.productId?.trim();
  if (!productKey) return null;

  const sliceDate = toSliceDate(input.date);
  const item = await getDayPoint(sku.konkName, productKey, sliceDate);
  if (!item) return null;

  return { stock: item.stock, price: item.price };
}
