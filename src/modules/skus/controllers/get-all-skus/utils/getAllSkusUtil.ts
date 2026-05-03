import type { Types } from "mongoose";
import { Sku } from "../../../models/Sku.js";
import { buildSkuListMongoFilter } from "../../../utils/buildSkuListMongoFilter.js";
import type { GetAllSkusQuery } from "../schemas/getAllSkusQuerySchema.js";

type SkuLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  productId: string;
  btradeAnalog: string;
  title: string;
  url: string;
  imageUrl: string;
  isInvalid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type GetAllSkusResult = {
  skus: SkuLean[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const getAllSkusUtil = async ({
  page,
  limit,
  ...query
}: GetAllSkusQuery): Promise<GetAllSkusResult> => {
  const filter = await buildSkuListMongoFilter(query);

  const [skus, total] = await Promise.all([
    Sku.find(filter)
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<SkuLean[]>,
    Sku.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    skus,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
