import { GraboSku } from "../../../models/GraboSku.js";
import { buildGraboSkuListMongoFilter } from "../../../utils/buildGraboSkuListMongoFilter.js";
import { getGraboSkuFilterOptions, } from "../../../utils/getGraboSkuFilterOptions.js";
export const getAllGraboSkusUtil = async ({ page, limit, includeFilterOptions, ...query }) => {
    const filter = buildGraboSkuListMongoFilter(query);
    const [graboSkus, total, filterOptions] = await Promise.all([
        GraboSku.find(filter)
            .select("-__v")
            .sort({ productId: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
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
