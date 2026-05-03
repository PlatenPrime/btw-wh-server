import type { Types } from "mongoose";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
import { buildSkuListMongoFilter } from "../../../utils/buildSkuListMongoFilter.js";
import type { GetAllSkusQuery } from "../../get-all-skus/schemas/getAllSkusQuerySchema.js";

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

type GetSkusBySkugrIdResult = {
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

export const getSkusBySkugrIdUtil = async (
  skugrId: string,
  query: GetAllSkusQuery,
): Promise<GetSkusBySkugrIdResult | null> => {
  const skugr = await Skugr.findById(skugrId).select("skus").lean();
  if (!skugr) {
    return null;
  }

  const { page, limit, notInAnySkugr: _omitOrphan, ...listQuery } = query;

  if (!skugr.skus.length) {
    return {
      skus: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }

  const baseFilter = await buildSkuListMongoFilter(listQuery);
  const filter: Record<string, unknown> = {
    ...baseFilter,
    _id: { $in: skugr.skus },
  };

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
