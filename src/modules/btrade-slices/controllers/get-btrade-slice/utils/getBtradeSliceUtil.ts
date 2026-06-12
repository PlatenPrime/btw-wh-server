import type { PipelineStage, Types } from "mongoose";
import { Art } from "../../../../arts/models/Art.js";
import { invalidSliceEntryMongoCondition } from "../../../../slices/utils/invalidSliceEntryMongoCondition.js";
import { BtradeSlice } from "../../../models/BtradeSlice.js";
import type { GetBtradeSliceQuery } from "../schemas/getBtradeSliceQuerySchema.js";

type ArtLean = {
  _id: Types.ObjectId;
  artikul: string;
  prodName?: string;
  nameukr?: string;
  namerus?: string;
  zone: string;
  limit?: number;
  marker?: string;
  abc?: string;
  btradeStock?: { value: number; date: Date };
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetBtradeSliceItem = {
  artikul: string;
  quantity: number;
  price: number;
  art: ArtLean | null;
};

export type GetBtradeSliceResult = {
  date: Date;
  items: GetBtradeSliceItem[];
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
  date: Date;
  total: number;
};

type SliceFacetRow = {
  artikul: string;
  quantity: number;
  price: number;
};

type SliceFacetBucket = {
  meta: SliceFacetMeta[];
  rows: SliceFacetRow[];
};

const dataEntriesArray = {
  $objectToArray: { $ifNull: ["$data", {}] },
} as const;

function buildSlicePagePipeline(
  sliceDate: Date,
  skip: number,
  limit: number
): PipelineStage[] {
  return [
    { $match: { date: sliceDate } },
    {
      $facet: {
        meta: [
          {
            $project: {
              _id: 0,
              date: 1,
              total: {
                $size: dataEntriesArray,
              },
            },
          },
        ],
        rows: [
          {
            $project: {
              entries: dataEntriesArray,
            },
          },
          { $unwind: "$entries" },
          { $sort: { "entries.k": 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              artikul: "$entries.k",
              quantity: "$entries.v.quantity",
              price: "$entries.v.price",
            },
          },
        ],
      },
    },
  ];
}

function buildInvalidSlicePagePipeline(
  sliceDate: Date,
  skip: number,
  limit: number
): PipelineStage[] {
  return [
    { $match: { date: sliceDate } },
    {
      $facet: {
        meta: [
          {
            $project: {
              _id: 0,
              date: 1,
              total: {
                $size: {
                  $filter: {
                    input: dataEntriesArray,
                    as: "e",
                    cond: invalidSliceEntryMongoCondition("e", "quantity"),
                  },
                },
              },
            },
          },
        ],
        rows: [
          {
            $project: {
              entries: dataEntriesArray,
            },
          },
          { $unwind: "$entries" },
          {
            $match: {
              $expr: invalidSliceEntryMongoCondition("entries", "quantity"),
            },
          },
          { $sort: { "entries.k": 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              artikul: "$entries.k",
              quantity: "$entries.v.quantity",
              price: "$entries.v.price",
            },
          },
        ],
      },
    },
  ];
}

/**
 * Возвращает постраничный срез Btrade по дате с опциональным фильтром isInvalid.
 */
export async function getBtradeSliceUtil(
  input: GetBtradeSliceQuery
): Promise<GetBtradeSliceResult | null> {
  const { page, limit } = input;
  const sliceDate = input.date;
  const skip = (page - 1) * limit;

  const pipeline = input.isInvalid
    ? buildInvalidSlicePagePipeline(sliceDate, skip, limit)
    : buildSlicePagePipeline(sliceDate, skip, limit);

  const aggResult = await BtradeSlice.aggregate<SliceFacetBucket>(pipeline)
    .option({ allowDiskUse: true })
    .exec();
  const bucket = aggResult[0];

  if (!bucket) return null;

  const meta = bucket.meta[0];
  if (!meta) return null;

  const { date, total } = meta;
  const rows = bucket.rows ?? [];

  const artikuls = rows.map((r) => r.artikul);
  const arts =
    artikuls.length > 0
      ? ((await Art.find({ artikul: { $in: artikuls } }).lean().exec()) as ArtLean[])
      : [];

  const artByArtikul = new Map<string, ArtLean>();
  for (const art of arts) {
    artByArtikul.set(art.artikul, art);
  }

  const items: GetBtradeSliceItem[] = rows.map((row) => ({
    artikul: row.artikul,
    quantity: row.quantity,
    price: row.price,
    art: artByArtikul.get(row.artikul) ?? null,
  }));

  const totalPages = Math.ceil(total / limit) || 0;

  return {
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
