import mongoose from "mongoose";
import User from "../../../../auth/models/User.js";
import { Ask } from "../../../models/Ask.js";
import { completeAskUtil } from "../../complete-ask-by-id/utils/completeAskUtil.js";
import { getCompleteAskMesUtil } from "../../complete-ask-by-id/utils/getCompleteAskMesUtil.js";
import { sendCompleteAskMesUtil } from "../../complete-ask-by-id/utils/sendCompleteAskMesUtil.js";
import { getRemainingQuantityUtil } from "../../get-ask-pull/utils/getRemainingQuantityUtil.js";
/**
 * Проверяет asks на готовность к завершению и автоматически завершает их
 * @param asks - Массив asks со статусом "processing" для проверки
 * @returns Массив ID завершенных asks
 */
export const checkAndCompleteAsksUtil = async (asks) => {
    const completedAskIds = [];
    // Фильтруем asks, которые готовы к завершению
    const asksToComplete = asks.filter((ask) => {
        // Проверяем только asks со статусом "processing" (у которых есть solver)
        if (ask.status !== "processing" || !ask.solver) {
            return false;
        }
        const remainingQuantity = getRemainingQuantityUtil(ask);
        const pullQuant = typeof ask.pullQuant === "number" ? ask.pullQuant : 0;
        const hasQuant = typeof ask.quant === "number" && ask.quant > 0;
        if (hasQuant) {
            // Проверяем, что оставшееся количество <= 0 (т.е. pullQuant >= quant)
            return remainingQuantity <= 0;
        }
        // Для ask без quant завершаем, если есть хотя бы одно списание
        return pullQuant > 0;
    });
    // Завершаем каждый готовый ask
    for (const ask of asksToComplete) {
        try {
            const session = await mongoose.startSession();
            try {
                let solver = null;
                let updatedAsk = null;
                await session.withTransaction(async () => {
                    // Получаем solver из ask
                    solver = await User.findById(ask.solver).session(session);
                    if (!solver) {
                        throw new Error(`Solver user not found for ask ${ask._id.toString()}`);
                    }
                    // Обновляем ask в транзакции, чтобы получить актуальную версию
                    const currentAsk = await Ask.findById(ask._id).session(session);
                    if (!currentAsk) {
                        throw new Error(`Ask not found: ${ask._id.toString()}`);
                    }
                    // Проверяем еще раз, что ask все еще готов к завершению
                    const remainingQuantity = getRemainingQuantityUtil(currentAsk);
                    const pullQuant = typeof currentAsk.pullQuant === "number" ? currentAsk.pullQuant : 0;
                    const hasQuant = typeof currentAsk.quant === "number" && currentAsk.quant > 0;
                    if (currentAsk.status !== "processing" || !currentAsk.solver) {
                        // Ask уже был обработан или изменился, пропускаем
                        return;
                    }
                    if (hasQuant && remainingQuantity > 0) {
                        return;
                    }
                    if (!hasQuant && pullQuant <= 0) {
                        return;
                    }
                    updatedAsk = await completeAskUtil({
                        solver,
                        solverId: solver._id,
                        ask: currentAsk,
                        session,
                    });
                });
                // Отправляем сообщение asker'у после успешного завершения
                if (updatedAsk && updatedAsk.askerData?.telegram) {
                    const message = getCompleteAskMesUtil({
                        ask: updatedAsk,
                        solverName: solver.fullname,
                    });
                    await sendCompleteAskMesUtil({
                        message,
                        telegramChatId: updatedAsk.askerData.telegram,
                    });
                }
                completedAskIds.push(ask._id.toString());
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            // Логируем ошибку, но продолжаем обработку остальных asks
            console.error(`Error completing ask ${ask._id.toString()}:`, error instanceof Error ? error.message : error);
        }
    }
    return completedAskIds;
};
