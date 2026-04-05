import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Sku } from "../../../models/Sku.js";
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export const getAllSkusUtil = async ({ konkName, prodName, search, isInvalid, createdFrom, page, limit, }) => {
    const filter = {};
    if (konkName && konkName.trim() !== "")
        filter.konkName = konkName;
    if (prodName && prodName.trim() !== "")
        filter.prodName = prodName;
    if (search && search.trim() !== "") {
        filter.title = {
            $regex: escapeRegex(search.trim()),
            $options: "i",
        };
    }
    if (typeof isInvalid === "boolean")
        filter.isInvalid = isInvalid;
    if (createdFrom != null) {
        filter.createdAt = { $gte: toSliceDate(createdFrom) };
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
