import { Art } from "../../../models/Art.js";
/**
 * Удаляет все артикулы, у которых маркер отсутствует или меньше максимального маркера в базе
 * @returns Статистика удаления и максимальный маркер
 */
export const deleteArtsWithoutLatestMarkerUtil = async () => {
    // Находим максимальный маркер среди всех артикулов
    const aggregationResult = await Art.aggregate([
        {
            $group: {
                _id: null,
                maxMarker: { $max: "$marker" },
            },
        },
    ]);
    // Если в базе нет артикулов или нет маркеров, возвращаем пустой результат
    if (!aggregationResult ||
        aggregationResult.length === 0 ||
        !aggregationResult[0].maxMarker) {
        return {
            deletedCount: 0,
            latestMarker: null,
        };
    }
    const latestMarker = aggregationResult[0].maxMarker;
    // Удаляем все артикулы, у которых:
    // 1. marker отсутствует (null, undefined, пустая строка)
    // 2. marker меньше максимального
    const deleteResult = await Art.deleteMany({
        $or: [
            { marker: { $exists: false } },
            { marker: null },
            { marker: "" },
            { marker: { $lt: latestMarker } },
        ],
    });
    return {
        deletedCount: deleteResult.deletedCount,
        latestMarker: latestMarker,
    };
};
