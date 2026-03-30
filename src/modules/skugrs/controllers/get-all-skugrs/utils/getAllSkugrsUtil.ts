import type { Types } from "mongoose";
import { Skugr } from "../../../models/Skugr.js";
import type { GetAllSkugrsQuery } from "../schemas/getAllSkugrsQuerySchema.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type SkugrLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  isSliced: boolean;
  skus: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

type GetAllSkugrsResult = {
  skugrs: SkugrLean[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const getAllSkugrsUtil = async ({
  konkName,
  prodName,
  search,
  isSliced,
  page,
  limit,
}: GetAllSkugrsQuery): Promise<GetAllSkugrsResult> => {
  const filter: Record<string, unknown> = {};
  if (konkName && konkName.trim() !== "") filter.konkName = konkName;
  if (prodName && prodName.trim() !== "") filter.prodName = prodName;
  if (search && search.trim() !== "") {
    filter.title = {
      $regex: escapeRegex(search.trim()),
      $options: "i",
    };
  }
  if (isSliced !== undefined) filter.isSliced = isSliced;

  const [skugrs, total] = await Promise.all([
    Skugr.find(filter)
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<SkugrLean[]>,
    Skugr.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    skugrs,
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
