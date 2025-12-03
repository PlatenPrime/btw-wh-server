import { Ask } from "../../../models/Ask.js";
import { getPosesByArtikulUtil } from "../../../../poses/controllers/get-poses-by-artikul/utils/getPosesByArtikulUtil.js";
import { calculatePositionsForPullUtil } from "./calculatePositionsForPullUtil.js";
import { getRemainingQuantityUtil } from "./getRemainingQuantityUtil.js";
import { GetAskPullResponse } from "../types/getAskPullResponse.js";

/**
 * Получает информацию о позициях для снятия товара по ask
 * @param askId - ID ask для получения позиций
 * @returns Ответ с позициями для снятия или null если ask не найден
 */
export const getAskPullUtil = async (
  askId: string
): Promise<GetAskPullResponse | null> => {
  // Получаем ask по ID
  const ask = await Ask.findById(askId).exec();
  
  if (!ask) {
    return null;
  }

  // Рассчитываем оставшееся количество
  const remainingQuantity = getRemainingQuantityUtil(ask);

  // Получаем все позиции с таким же артикулом
  const positions = await getPosesByArtikulUtil(ask.artikul);

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
    // Если quant не указан, но есть позиции - снятие требуется
    isPullRequired = positions.length > 0;
  } else if (remainingQuantity <= 0) {
    // Если уже все снято или не нужно снимать, снятие не требуется
    isPullRequired = false;
  }

  // Рассчитываем позиции для снятия
  const positionsForPull = calculatePositionsForPullUtil(
    positions,
    remainingQuantity
  );

  return {
    isPullRequired,
    positions: positionsForPull,
    remainingQuantity,
  };
};

