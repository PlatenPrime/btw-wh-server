import { Ask } from "../../../models/Ask.js";
import { getAskPullUtil } from "../../get-ask-pull/utils/getAskPullUtil.js";
import { groupPositionsBySectorUtil } from "./groupPositionsBySectorUtil.js";
/**
 * Получает все позиции для снятия по всем активным asks
 * @returns Ответ с позициями, сгруппированными по секторам, и список processing asks для фоновой обработки
 */
export const getAsksPullsUtil = async () => {
    // Получаем все asks со статусом "new" или "processing"
    const asks = await Ask.find({
        status: { $in: ["new", "processing"] },
    }).exec();
    // Собираем все позиции для снятия
    const allPositions = [];
    const processingAsks = [];
    for (const ask of asks) {
        const pullResult = await getAskPullUtil(ask._id.toString());
        if (pullResult && pullResult.isPullRequired) {
            // Добавляем позиции для снятия
            allPositions.push(...pullResult.positions);
        }
        // Сохраняем asks со статусом "processing" для проверки на автоматическое завершение
        if (ask.status === "processing") {
            processingAsks.push(ask);
        }
    }
    // Группируем позиции по секторам
    const positionsBySector = groupPositionsBySectorUtil(allPositions);
    return {
        response: {
            positionsBySector,
        },
        processingAsks,
    };
};
