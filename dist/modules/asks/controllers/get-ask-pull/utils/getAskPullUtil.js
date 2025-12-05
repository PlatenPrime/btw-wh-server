import { Ask } from "../../../models/Ask.js";
import { calculatePositionsForPullUtil } from "./calculatePositionsForPullUtil.js";
import { getPosesByArtikulAndSkladUtil } from "./getPosesByArtikulAndSkladUtil.js";
import { getRemainingQuantityUtil } from "./getRemainingQuantityUtil.js";
/**
 * Получает информацию о позициях для снятия товара по ask
 * @param askId - ID ask для получения позиций
 * @returns Ответ с позициями для снятия или null если ask не найден
 */
export const getAskPullUtil = async (askId) => {
    // Получаем ask по ID
    const ask = await Ask.findById(askId).exec();
    if (!ask) {
        return null;
    }
    // Проверяем статус ask - если rejected или completed, снятие не требуется
    if (ask.status === "rejected" || ask.status === "completed") {
        return {
            isPullRequired: false,
            positions: [],
            remainingQuantity: null,
        };
    }
    // Рассчитываем оставшееся количество
    const remainingQuantity = getRemainingQuantityUtil(ask);
    // Получаем склад из ask (дефолт "pogrebi" если не указан)
    const sklad = ask.sklad || "pogrebi";
    // Получаем позиции с таким же артикулом и складом (только с quant > 0)
    const positions = await getPosesByArtikulAndSkladUtil(ask.artikul, sklad);
    // Если позиций нет
    if (positions.length === 0) {
        return {
            isPullRequired: false,
            positions: [],
            remainingQuantity,
        };
    }
    // Определяем флаг необходимости снятия
    let isPullRequired = true;
    if (remainingQuantity === null) {
        // Если quant не указан:
        // - Если уже было снятие (pullQuant > 0), то снятие не требуется
        // - Если снятия не было и есть позиции с quant > 0, то снятие требуется
        isPullRequired = ask.pullQuant === 0 && positions.length > 0;
    }
    else if (remainingQuantity === 0) {
        // Если уже все снято, снятие не требуется
        isPullRequired = false;
    }
    else {
        // Если remainingQuantity > 0, снятие требуется
        isPullRequired = true;
    }
    // Рассчитываем позиции для снятия
    const positionsForPull = calculatePositionsForPullUtil(positions, remainingQuantity);
    return {
        isPullRequired,
        positions: positionsForPull,
        remainingQuantity,
    };
};
