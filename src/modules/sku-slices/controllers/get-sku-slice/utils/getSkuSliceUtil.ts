import type { Types } from "mongoose";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
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

export async function getSkuSliceUtil(
  input: GetSkuSliceQuery
): Promise<GetSkuSliceResult | null> {
  const { page, limit } = input;
  const sliceDate = toSliceDate(input.date);
  const doc = await SkuSlice.findOne({
    konkName: input.konkName,
    date: sliceDate,
  })
    .select("konkName date data")
    .lean();

  if (!doc) return null;

  const data = (doc.data ?? {}) as Record<string, ISkuSliceDataItem>;
  const sortedEntries = Object.entries(data).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const total = sortedEntries.length;
  const start = (page - 1) * limit;
  const pageEntries = sortedEntries.slice(start, start + limit);

  const productIds = pageEntries.map(([productId]) => productId);
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

  const items: GetSkuSliceItem[] = pageEntries.map(([productId, metrics]) => ({
    productId,
    stock: metrics.stock,
    price: metrics.price,
    sku: skuByProductId.get(productId) ?? null,
  }));

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    konkName: doc.konkName,
    date: doc.date,
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
