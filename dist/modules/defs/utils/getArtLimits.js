import { Art } from "../../arts/models/Art.js";
/**
 * Получает лимиты для артикулов из модели Art
 * @param artikuls - Массив артикулов
 * @returns Объект с лимитами по артикулам
 */
export async function getArtLimits(artikuls) {
    try {
        const arts = await Art.find({
            artikul: { $in: artikuls },
            limit: { $exists: true, $ne: null },
        })
            .select("artikul limit")
            .exec();
        const limits = {};
        arts.forEach((art) => {
            if (art.limit !== undefined && art.limit !== null) {
                limits[art.artikul] = art.limit;
            }
        });
        return limits;
    }
    catch (error) {
        console.error("Помилка при отриманні лімітів з моделі Art:", error);
        return {};
    }
}
