import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export const getSkusBySkugrIdUtil = async (skugrId, query) => {
    const skugr = await Skugr.findById(skugrId).select("skus").lean();
    if (!skugr) {
        return null;
    }
    const { konkName, prodName, search, page, limit } = query;
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
    const filter = {
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
