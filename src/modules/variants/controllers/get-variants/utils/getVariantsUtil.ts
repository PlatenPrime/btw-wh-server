import type { Types } from "mongoose";
import { Variant } from "../../../models/Variant.js";
import { buildVariantSearchFilter } from "../../../utils/buildVariantSearchFilter.js";
import type { GetVariantsQuery } from "../schemas/getVariantsQuerySchema.js";

type VariantLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  varGroup?: { id: string; title: string };
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type GetVariantsResult = {
  variants: VariantLean[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const getVariantsUtil = async (
  input: GetVariantsQuery
): Promise<GetVariantsResult> => {
  const { konkName, prodName, search, page, limit } = input;

  const baseFilter: Record<string, unknown> = {};
  if (konkName && konkName.trim() !== "") baseFilter.konkName = konkName;
  if (prodName && prodName.trim() !== "") baseFilter.prodName = prodName;

  const searchCondition = buildVariantSearchFilter(search);
  const filter =
    searchCondition === null
      ? baseFilter
      : Object.keys(baseFilter).length > 0
        ? { $and: [baseFilter, searchCondition] }
        : searchCondition;

  const [variants, total] = await Promise.all([
    Variant.find(filter)
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<VariantLean[]>,
    Variant.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    variants,
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

