import { Art } from "../../../models/Art.js";
export const getAllArtsUtil = async ({ page, limit, search, }) => {
    // Построение поискового запроса
    const searchQuery = search
        ? {
            $or: [
                { artikul: { $regex: search, $options: "i" } },
                { nameukr: { $regex: search, $options: "i" } },
                { namerus: { $regex: search, $options: "i" } },
            ],
        }
        : {};
    // Выполнение запроса с пагинацией
    const arts = await Art.find(searchQuery)
        .sort({ artikul: 1 })
        .skip((page - 1) * limit)
        .limit(limit);
    // Подсчет общего количества записей
    const total = await Art.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);
    return {
        arts,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};
