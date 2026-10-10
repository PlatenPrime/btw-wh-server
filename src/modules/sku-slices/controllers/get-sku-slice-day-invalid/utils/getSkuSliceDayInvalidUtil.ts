import type { Types } from "mongoose";
import { Sku } from "../../../../skus/models/Sku.js";
import { findDayPointsPage } from "../../../utils/skuSliceMonthStore.js";
import type { GetSkuSliceDayInvalidQuery } from "../schemas/getSkuSliceDayInvalidSchema.js";

type SkuLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  productId: string;
  btradeAnalog: string;
  title: string;
  url: string;
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetSkuSliceDayInvalidItem = {
  productId: string;
  stock: number;
  price: number;
  sku: SkuLean | null;
};

export type GetSkuSliceDayInvalidResult = {
  konkName: string;
  date: Date;
  items: GetSkuSliceDayInvalidItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

/**
 * Пагинация invalid точек дня из SkuSliceMonth + join Sku.
 */
export async function getSkuSliceDayInvalidUtil(
  input: GetSkuSliceDayInvalidQuery,
): Promise<GetSkuSliceDayInvalidResult> {
  const page = await findDayPointsPage({
    konkName: input.konkName,
    date: input.date,
    page: input.page,
    limit: input.limit,
    isInvalid: true,
  });

  const productIds = page.items.map((r) => r.productId);
  const skus =
    productIds.length > 0
      ? ((await Sku.find({ productId: { $in: productIds } })
          .lean()
          .exec()) as SkuLean[])
      : [];

  const skuByProductId = new Map<string, SkuLean>();
  for (const sku of skus) {
    skuByProductId.set(sku.productId, sku);
  }

  const items: GetSkuSliceDayInvalidItem[] = page.items.map((row) => ({
    productId: row.productId,
    stock: row.stock,
    price: row.price,
    sku: skuByProductId.get(row.productId) ?? null,
  }));

  const totalPages = Math.ceil(page.total / input.limit) || 0;

  return {
    konkName: page.konkName,
    date: page.date,
    items,
    pagination: {
      page: input.page,
      limit: input.limit,
      total: page.total,
      totalPages,
      hasNext: input.page < totalPages,
      hasPrev: input.page > 1,
    },
  };
}
