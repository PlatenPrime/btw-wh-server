import { Zone } from "../../../models/Zone.js";
export const getAllZonesUtil = async ({ page, limit, search, sortBy, sortOrder, }) => {
    // Построение поискового запроса
    const searchQuery = search
        ? {
            title: { $regex: search, $options: "i" },
        }
        : {};
    // Настройка сортировки
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    // Выполнение запроса с пагинацией
    const zones = await Zone.find(searchQuery)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);
    // Подсчет общего количества записей
    const total = await Zone.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);
    return {
        zones,
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
