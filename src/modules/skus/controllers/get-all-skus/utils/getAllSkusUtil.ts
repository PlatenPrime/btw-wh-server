import type { Types } from "mongoose";
import { Sku } from "../../../models/Sku.js";
import type { GetAllSkusQuery } from "../schemas/getAllSkusQuerySchema.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type SkuLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  btradeAnalog: string;
  title: string;
  url: string;
  imageUrl: string;
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
  konkName,
  prodName,
  search,
  page,
  limit,
}: GetAllSkusQuery): Promise<GetAllSkusResult> => {
  const filter: Record<string, unknown> = {};
  if (konkName && konkName.trim() !== "") filter.konkName = konkName;
  if (prodName && prodName.trim() !== "") filter.prodName = prodName;
  if (search && search.trim() !== "") {
    filter.title = {
      $regex: escapeRegex(search.trim()),
      $options: "i",
    };
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
