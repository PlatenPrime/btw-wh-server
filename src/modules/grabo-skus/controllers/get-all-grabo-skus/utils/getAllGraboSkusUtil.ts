import { GraboSku } from "../../../models/GraboSku.js";
import { buildGraboSkuListMongoFilter } from "../../../utils/buildGraboSkuListMongoFilter.js";
import {
  getGraboSkuFilterOptions,
  type GraboSkuFilterOptions,
} from "../../../utils/getGraboSkuFilterOptions.js";
import type { GraboSkuLean } from "../../../utils/graboSkuLean.js";
import type { GetAllGraboSkusQuery } from "../schemas/getAllGraboSkusQuerySchema.js";

export type GetAllGraboSkusResult = {
  graboSkus: GraboSkuLean[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filterOptions?: GraboSkuFilterOptions;
};

export const getAllGraboSkusUtil = async ({
  page,
  limit,
  includeFilterOptions,
  ...query
}: GetAllGraboSkusQuery): Promise<GetAllGraboSkusResult> => {
  const filter = buildGraboSkuListMongoFilter(query);

  const [graboSkus, total, filterOptions] = await Promise.all([
    GraboSku.find(filter)
      .select("-__v")
      .sort({ productId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<GraboSkuLean[]>(),
    GraboSku.countDocuments(filter),
    includeFilterOptions
      ? getGraboSkuFilterOptions()
      : Promise.resolve(undefined),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    graboSkus,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    ...(filterOptions !== undefined ? { filterOptions } : {}),
  };
};
