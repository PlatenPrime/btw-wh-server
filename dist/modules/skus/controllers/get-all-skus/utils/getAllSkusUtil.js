import { Sku } from "../../../models/Sku.js";
export const getAllSkusUtil = async ({ konkName, prodName, page, limit, }) => {
    const filter = {};
    if (konkName && konkName.trim() !== "")
        filter.konkName = konkName;
    if (prodName && prodName.trim() !== "")
        filter.prodName = prodName;
    const [skus, total] = await Promise.all([
        Sku.find(filter)
            .sort({ createdAt: -1 })
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
