import { Pos } from "../../../models/Pos.js";
/**
 * Получает все позиции с фильтрацией и пагинацией
 */
export const getAllPosesUtil = async ({ filter, page, limit, }) => {
    // Строим фильтр
    const mongoFilter = {};
    if (filter.palletId)
        mongoFilter["palletData._id"] = filter.palletId;
    if (filter.rowId)
        mongoFilter["rowData._id"] = filter.rowId;
    if (filter.rowTitle)
        mongoFilter["rowData.title"] = filter.rowTitle;
    if (filter.palletTitle)
        mongoFilter["palletData.title"] = filter.palletTitle;
    if (filter.artikul)
        mongoFilter.artikul = { $regex: filter.artikul, $options: "i" };
    if (filter.nameukr)
        mongoFilter.nameukr = { $regex: filter.nameukr, $options: "i" };
    if (filter.sklad)
        mongoFilter.sklad = { $regex: filter.sklad, $options: "i" };
    const skip = (page - 1) * limit;
    // Получаем позиции
    const poses = await Pos.find(mongoFilter)
        .skip(skip)
        .limit(limit)
        .sort({ artikul: 1 });
    const total = await Pos.countDocuments(mongoFilter);
    return {
        data: poses,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};
