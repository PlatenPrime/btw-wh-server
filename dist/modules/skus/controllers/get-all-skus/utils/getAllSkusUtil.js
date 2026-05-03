import { Sku } from "../../../models/Sku.js";
import { buildSkuListMongoFilter } from "../../../utils/buildSkuListMongoFilter.js";
export const getAllSkusUtil = async ({ page, limit, ...query }) => {
    const filter = await buildSkuListMongoFilter(query);
    const [skus, total] = await Promise.all([
        Sku.find(filter)
            .sort({ title: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
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
