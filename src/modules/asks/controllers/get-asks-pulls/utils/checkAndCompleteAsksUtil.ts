import mongoose from "mongoose";
import User from "../../../../auth/models/User.js";
import { Ask, IAsk } from "../../../models/Ask.js";
import { getRemainingQuantityUtil } from "../../get-ask-pull/utils/getRemainingQuantityUtil.js";
import { completeAskUtil } from "../../complete-ask-by-id/utils/completeAskUtil.js";
import { getCompleteAskMesUtil } from "../../complete-ask-by-id/utils/getCompleteAskMesUtil.js";
import { sendCompleteAskMesUtil } from "../../complete-ask-by-id/utils/sendCompleteAskMesUtil.js";

/**
 * Проверяет asks на готовность к завершению и автоматически завершает их
 * @param asks - Массив asks со статусом "processing" для проверки
 * @returns Массив ID завершенных asks
 */
export const checkAndCompleteAsksUtil = async (
  asks: IAsk[]
): Promise<string[]> => {
  const completedAskIds: string[] = [];

  // Фильтруем asks, которые готовы к завершению
  const asksToComplete = asks.filter((ask) => {
    // Проверяем только asks со статусом "processing" (у которых есть solver)
    if (ask.status !== "processing" || !ask.solver) {
      return false;
    }

    // Проверяем, что quant указан
    if (typeof ask.quant !== "number" || ask.quant <= 0) {
      return false;
    }

    // Проверяем, что оставшееся количество <= 0 (т.е. pullQuant >= quant)
    const remainingQuantity = getRemainingQuantityUtil(ask);
    return remainingQuantity <= 0;
  });

  // Завершаем каждый готовый ask
  for (const ask of asksToComplete) {
    try {
      const session = await mongoose.startSession();

      try {
        let solver: any = null;
        let updatedAsk: any = null;

        await session.withTransaction(async () => {
          // Получаем solver из ask
          solver = await User.findById(ask.solver).session(session);
          if (!solver) {
            throw new Error(
              `Solver user not found for ask ${(ask._id as mongoose.Types.ObjectId).toString()}`
            );
          }

          // Обновляем ask в транзакции, чтобы получить актуальную версию
          const currentAsk = await Ask.findById(
            ask._id as mongoose.Types.ObjectId
          ).session(session);
          if (!currentAsk) {
            throw new Error(
              `Ask not found: ${(ask._id as mongoose.Types.ObjectId).toString()}`
            );
          }

          // Проверяем еще раз, что ask все еще готов к завершению
          const remainingQuantity = getRemainingQuantityUtil(currentAsk);
          if (
            currentAsk.status !== "processing" ||
            !currentAsk.solver ||
            typeof currentAsk.quant !== "number" ||
            currentAsk.quant <= 0 ||
            remainingQuantity > 0
          ) {
            // Ask уже был обработан или изменился, пропускаем
            return;
          }

          updatedAsk = await completeAskUtil({
            solver,
            solverId: solver._id as mongoose.Types.ObjectId,
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
            telegramChatId: updatedAsk.askerData.telegram as string,
          });
        }

        completedAskIds.push(
          (ask._id as mongoose.Types.ObjectId).toString()
        );
      } finally {
        await session.endSession();
      }
    } catch (error) {
      // Логируем ошибку, но продолжаем обработку остальных asks
      console.error(
        `Error completing ask ${(ask._id as mongoose.Types.ObjectId).toString()}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return completedAskIds;
};

