import { Variant } from "../../../models/Variant.js";
import { buildVariantSearchFilter } from "../../../utils/buildVariantSearchFilter.js";
export const getVariantsUtil = async (input) => {
    const { konkName, prodName, search, page, limit } = input;
    const baseFilter = {};
    if (konkName && konkName.trim() !== "")
        baseFilter.konkName = konkName;
    if (prodName && prodName.trim() !== "")
        baseFilter.prodName = prodName;
    const searchCondition = buildVariantSearchFilter(search);
    const filter = searchCondition === null
        ? baseFilter
        : Object.keys(baseFilter).length > 0
            ? { $and: [baseFilter, searchCondition] }
            : searchCondition;
    const [variants, total] = await Promise.all([
        Variant.find(filter)
            .sort({ title: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
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
