import { Skugr } from "../../../models/Skugr.js";
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export const getAllSkugrsUtil = async ({ konkName, prodName, search, isSliced, page, limit, }) => {
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
    if (isSliced !== undefined)
        filter.isSliced = isSliced;
    const [skugrs, total] = await Promise.all([
        Skugr.find(filter)
            .sort({ title: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
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
