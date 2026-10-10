import type { Types } from "mongoose";
import { Sku } from "../../../../skus/models/Sku.js";
import { findDayPointsPage } from "../../../utils/skuSliceMonthStore.js";
import type { GetSkuSliceQuery } from "../schemas/getSkuSliceQuerySchema.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";

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

export type GetSkuSliceItem = {
  productId: string;
  stock: number;
  price: number;
  sku: SkuLean | null;
};

export type GetSkuSliceResult = {
  konkName: string;
  date: Date;
  items: GetSkuSliceItem[];
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
 * @deprecated HTTP GET / снят (410). Логика оставлена для тестов / day-invalid twin.
 * Читает из SkuSliceMonth.
 */
export async function getSkuSliceUtil(
  input: GetSkuSliceQuery,
): Promise<GetSkuSliceResult | null> {
  const { page, limit } = input;
  const sliceDate = toSliceDate(input.date);

  const pageResult = await findDayPointsPage({
    konkName: input.konkName,
    date: sliceDate,
    page,
    limit,
    isInvalid: input.isInvalid === true,
  });

  if (pageResult.total === 0 && input.isInvalid !== true) {
    // empty day is valid empty page, not 404 — keep old 404 only when no points at all
    // for monitoring twin we still return empty list
  }

  const productIds = pageResult.items.map((r) => r.productId);
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

  const items: GetSkuSliceItem[] = pageResult.items.map((row) => ({
    productId: row.productId,
    stock: row.stock,
    price: row.price,
    sku: skuByProductId.get(row.productId) ?? null,
  }));

  const totalPages = Math.ceil(pageResult.total / limit) || 0;

  return {
    konkName: pageResult.konkName,
    date: pageResult.date,
    items,
    pagination: {
      page,
      limit,
      total: pageResult.total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
