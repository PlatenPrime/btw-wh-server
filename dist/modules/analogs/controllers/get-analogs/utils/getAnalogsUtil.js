import { Analog } from "../../../models/Analog.js";
import { buildAnalogSearchFilter } from "../../../utils/buildAnalogSearchFilter.js";
export const getAnalogsUtil = async ({ konkName, prodName, search, page, limit, }) => {
    const baseFilter = {};
    if (konkName && konkName.trim() !== "")
        baseFilter.konkName = konkName;
    if (prodName && prodName.trim() !== "")
        baseFilter.prodName = prodName;
    const searchCondition = buildAnalogSearchFilter(search);
    const filter = searchCondition === null
        ? baseFilter
        : Object.keys(baseFilter).length > 0
            ? { $and: [baseFilter, searchCondition] }
            : searchCondition;
    const [analogs, total] = await Promise.all([
        Analog.find(filter)
            .sort({ artikul: 1 })
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
