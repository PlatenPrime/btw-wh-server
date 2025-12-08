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
    const ask = await Ask.findById(askId).exec();
    if (!ask) {
        return null;
    }
    if (ask.status === "rejected" || ask.status === "completed") {
        return {
            isPullRequired: false,
            positions: [],
            remainingQuantity: null,
            status: "finished",
            message: "Запит вже відпрацьовано",
        };
    }
    const remainingQuantity = getRemainingQuantityUtil(ask);
    if (remainingQuantity <= 0 && ask.quant) {
        return {
            isPullRequired: false,
            positions: [],
            remainingQuantity,
            status: "satisfied",
            message: "Знімати більше нічого не потрібно",
        };
    }
    if (remainingQuantity < 0) {
        return {
            isPullRequired: false,
            positions: [],
            remainingQuantity,
            status: "satisfied",
            message: "Знімати більше нічого не потрібно",
        };
    }
    const positions = await getPosesByArtikulAndSkladUtil(ask.artikul, ask.sklad || "pogrebi");
    if (positions.length === 0) {
        return {
            isPullRequired: false,
            positions: [],
            remainingQuantity,
            status: "no_poses",
            message: "Позицій для зняття не знайдено",
        };
    }
    const positionsForPull = calculatePositionsForPullUtil(positions, 
    // Если quant не указан, передаем null, чтобы сработал сценарий 1 (одна позиция)
    // getRemainingQuantityUtil возвращает 0 если quant не указан, но нам для calculatePositions нужно null
    (ask.quant === undefined || ask.quant === null || ask.quant <= 0) ? null : remainingQuantity);
    return {
        isPullRequired: true,
        positions: positionsForPull,
        remainingQuantity,
        status: "process",
        message: "Знімати потрібно",
    };
};
