import mongoose from "mongoose";
import { Ask, IAsk } from "../../../models/Ask.js";
import { IPositionForPull } from "../../get-ask-pull/types/getAskPullResponse.js";
import { getAskPullUtil } from "../../get-ask-pull/utils/getAskPullUtil.js";
import { GetAsksPullsResponse } from "../types/getAsksPullsResponse.js";
import { groupPositionsBySectorUtil } from "./groupPositionsBySectorUtil.js";

/**
 * Получает все позиции для снятия по всем активным asks
 * @returns Ответ с позициями, сгруппированными по секторам, и список processing asks для фоновой обработки
 */
export const getAsksPullsUtil = async (): Promise<{
  response: GetAsksPullsResponse;
  processingAsks: IAsk[];
}> => {
  // Получаем все asks со статусом "new" или "processing"
  const asks = await Ask.find({
    status: { $in: ["new", "processing"] },
  }).exec();

  // Собираем все позиции для снятия
  const allPositions: IPositionForPull[] = [];
  const processingAsks: IAsk[] = [];

  for (const ask of asks) {
    const pullResult = await getAskPullUtil(
      (ask._id as mongoose.Types.ObjectId).toString()
    );

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
