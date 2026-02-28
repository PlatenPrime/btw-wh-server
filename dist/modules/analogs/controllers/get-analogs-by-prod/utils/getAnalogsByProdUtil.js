import { Analog } from "../../../models/Analog.js";
import { buildAnalogSearchFilter } from "../../../utils/buildAnalogSearchFilter.js";
export const getAnalogsByProdUtil = async (input) => {
    const { prodName, page, limit, search } = input;
    const baseFilter = { prodName };
    const searchCondition = buildAnalogSearchFilter(search);
    const filter = searchCondition === null
        ? baseFilter
        : { $and: [baseFilter, searchCondition] };
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
