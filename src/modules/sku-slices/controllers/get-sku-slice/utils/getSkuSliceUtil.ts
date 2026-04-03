import type { PipelineStage, Types } from "mongoose";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
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

type SliceFacetMeta = {
  konkName: string;
  date: Date;
  total: number;
};

type SliceFacetRow = {
  productId: string;
  stock: number;
  price: number;
};

type SliceFacetBucket = {
  meta: SliceFacetMeta[];
  rows: SliceFacetRow[];
};

function buildSlicePagePipeline(
  konkName: string,
  sliceDate: Date,
  skip: number,
  limit: number
): PipelineStage[] {
  return [
    { $match: { konkName, date: sliceDate } },
    {
      $facet: {
        meta: [
          {
            $project: {
              _id: 0,
              konkName: 1,
              date: 1,
              total: {
                $size: {
                  $objectToArray: { $ifNull: ["$data", {}] },
                },
              },
            },
          },
        ],
        rows: [
          {
            $project: {
              entries: { $objectToArray: { $ifNull: ["$data", {}] } },
            },
          },
          { $unwind: "$entries" },
          { $sort: { "entries.k": 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              productId: "$entries.k",
              stock: "$entries.v.stock",
              price: "$entries.v.price",
            },
          },
        ],
      },
    },
  ];
}

export async function getSkuSliceUtil(
  input: GetSkuSliceQuery
): Promise<GetSkuSliceResult | null> {
  const { page, limit } = input;
  const sliceDate = toSliceDate(input.date);
  const skip = (page - 1) * limit;

  const pipeline = buildSlicePagePipeline(
    input.konkName,
    sliceDate,
    skip,
    limit
  );

  const aggResult = await SkuSlice.aggregate<SliceFacetBucket>(pipeline)
    .option({ allowDiskUse: true })
    .exec();
  const bucket = aggResult[0];

  if (!bucket) return null;

  const meta = bucket.meta[0];
  if (!meta) return null;

  const { konkName, date, total } = meta;
  const rows = bucket.rows ?? [];

  const productIds = rows.map((r) => r.productId);
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

  const items: GetSkuSliceItem[] = rows.map((row) => ({
    productId: row.productId,
    stock: row.stock,
    price: row.price,
    sku: skuByProductId.get(row.productId) ?? null,
  }));

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    konkName,
    date,
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
