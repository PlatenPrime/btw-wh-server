import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
import { buildSkuListMongoFilter } from "../../../utils/buildSkuListMongoFilter.js";
export const getSkusBySkugrIdUtil = async (skugrId, query) => {
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
    const filter = {
        ...baseFilter,
        _id: { $in: skugr.skus },
    };
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
