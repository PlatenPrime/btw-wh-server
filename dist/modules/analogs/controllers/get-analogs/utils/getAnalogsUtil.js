import { Analog } from "../../../models/Analog.js";
export const getAnalogsUtil = async ({ konkName, prodName, page, limit, }) => {
    const filter = {};
    if (konkName && konkName.trim() !== "")
        filter.konkName = konkName;
    if (prodName && prodName.trim() !== "")
        filter.prodName = prodName;
    const [analogs, total] = await Promise.all([
        Analog.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Analog.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        analogs,
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
