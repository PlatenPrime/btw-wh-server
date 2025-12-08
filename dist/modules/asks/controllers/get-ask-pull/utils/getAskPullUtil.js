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
            status: "completed",
        };
    }
    // Рассчитываем оставшееся количество
    const remainingQuantity = getRemainingQuantityUtil(ask);
    // Получаем склад из ask (дефолт "pogrebi" если не указан)
    const sklad = ask.sklad || "pogrebi";
    // Получаем позиции с таким же артикулом и складом (только с quant > 0)
    const positions = await getPosesByArtikulAndSkladUtil(ask.artikul, sklad);
    // Определяем статус
    let status = "need_pull";
    if (remainingQuantity === null) {
        // Если quant не указан и ничего не снято (иначе было бы отрицательное число из util)
        status = "need_pull";
    }
    else if (remainingQuantity < 0) {
        status = "excess";
    }
    else if (remainingQuantity === 0) {
        status = "completed";
    }
    else {
        status = "need_pull";
    }
    // Если позиций нет
    if (positions.length === 0) {
        return {
            isPullRequired: false,
            positions: [],
            remainingQuantity,
            status,
        };
    }
    // Определяем флаг необходимости снятия
    // Снятие нужно только если статус need_pull и есть позиции
    const isPullRequired = status === "need_pull";
    if (!isPullRequired) {
        return {
            isPullRequired,
            positions: [],
            remainingQuantity,
            status,
        };
    }
    // Рассчитываем позиции для снятия
    const positionsForPull = calculatePositionsForPullUtil(positions, remainingQuantity);
    return {
        isPullRequired,
        positions: positionsForPull,
        remainingQuantity,
        status,
    };
};
