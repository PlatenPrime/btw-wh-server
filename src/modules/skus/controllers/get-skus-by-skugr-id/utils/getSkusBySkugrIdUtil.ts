import type { Types } from "mongoose";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
import type { GetAllSkusQuery } from "../../get-all-skus/schemas/getAllSkusQuerySchema.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

  const { konkName, prodName, search, isInvalid, createdFrom, page, limit } =
    query;

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

  const filter: Record<string, unknown> = {
    _id: { $in: skugr.skus },
  };
  if (konkName && konkName.trim() !== "") {
    filter.konkName = konkName;
  }
  if (prodName && prodName.trim() !== "") {
    filter.prodName = prodName;
  }
  if (search && search.trim() !== "") {
    filter.title = {
      $regex: escapeRegex(search.trim()),
      $options: "i",
    };
  }
  if (typeof isInvalid === "boolean") filter.isInvalid = isInvalid;
  if (createdFrom != null) {
    filter.createdAt = { $gte: toSliceDate(createdFrom) };
  }

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
