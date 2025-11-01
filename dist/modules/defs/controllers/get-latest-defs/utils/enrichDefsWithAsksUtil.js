import { Ask } from "../../../../asks/models/Ask.js";
/**
 * Обогащает дефициты информацией о существующих активных заявках
 * @param latestDef - последняя запись дефицитов
 * @returns Promise<IDeficitCalculationResultWithAsks> - дефициты с информацией о заявках
 */
export async function enrichDefsWithAsksUtil(latestDef) {
    // Получаем все активные заявки для артикулов из дефицитов
    const artikuls = Object.keys(latestDef.result);
    const existingAsks = await Ask.find({
        artikul: { $in: artikuls },
        status: { $in: ["new"] }, // только необработанные заявки
    })
        .select("artikul status createdAt askerData.fullname askerData._id")
        .lean();
    // Группируем заявки по артикулу (берем только первую активную заявку)
    const asksByArtikul = existingAsks.reduce((acc, ask) => {
        if (!acc[ask.artikul]) {
            acc[ask.artikul] = {
                _id: ask._id.toString(),
                status: ask.status,
                createdAt: ask.createdAt,
                askerName: ask.askerData.fullname,
                askerId: ask.askerData._id.toString(),
            };
        }
        return acc;
    }, {});
    // Добавляем информацию о заявках к каждому дефициту
    const resultWithAsks = Object.keys(latestDef.result).reduce((acc, artikul) => {
        acc[artikul] = {
            ...latestDef.result[artikul],
            existingAsk: asksByArtikul[artikul] || null,
        };
        return acc;
    }, {});
    return resultWithAsks;
}
