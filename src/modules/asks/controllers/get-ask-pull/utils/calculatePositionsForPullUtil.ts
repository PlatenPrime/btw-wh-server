import { IPos } from "../../../../poses/models/Pos.js";
import { sortPositionsByPalletSectorUtil } from "../../../../poses/utils/sort-positions-by-pallet-sector-util/sortPositionsByPalletSectorUtil.js";
import { IPositionForPull } from "../types/getAskPullResponse.js";

/**
 * Рассчитывает список позиций для снятия товара
 * @param positions - Массив всех позиций с нужным артикулом
 * @param remainingQuantity - Оставшееся количество для снятия:
 *   - null - если quant не указан в ask
 *   - 0 - если уже все снято (pullQuant >= quant)
 *   - number > 0 - оставшееся количество для снятия
 * @param askId - ID ask, для которого предназначены позиции
 * @param askArtikul - Артикул из ask
 * @param askQuant - Количество товара, которое просят в ask (null если quant не указан)
 * @param askRemainingQuantity - Оставшееся количество для снятия по ask (null если quant не указан)
 * @returns Массив позиций с указанием plannedQuant для снятия
 */
export const calculatePositionsForPullUtil = (
  positions: IPos[],
  remainingQuantity: number | null,
  askId: string,
  askArtikul: string,
  askQuant: number | null,
  askRemainingQuantity: number | null
): IPositionForPull[] => {
  // Сценарий 3: позиций нет
  if (positions.length === 0) {
    return [];
  }

  // Сценарий 1: quant не указан - возвращаем одну позицию с наименьшим сектором
  if (remainingQuantity === null) {
    const sortedPositions = sortPositionsByPalletSectorUtil([...positions]);
    const firstPosition = sortedPositions[0];
    
    // Проверяем, что первая позиция имеет количество > 0
    // Если все позиции имеют quant === 0, возвращаем пустой массив
    if (!firstPosition || firstPosition.quant <= 0) {
      return [];
    }
    
    return [
      {
        ...firstPosition.toObject(),
        plannedQuant: null,
        askId,
        askArtikul,
        askQuant,
        askRemainingQuantity,
      } as IPositionForPull,
    ];
  }

  // Сценарий 2: quant указан и осталось снять
  // Сортируем позиции по сектору паллеты
  const sortedPositions = sortPositionsByPalletSectorUtil([...positions]);
  const positionsForPull: IPositionForPull[] = [];
  let remaining = remainingQuantity;

  // Распределяем оставшееся количество между позициями
  for (const position of sortedPositions) {
    if (remaining <= 0) {
      break;
    }

    const availableQuant = Math.max(position.quant, 0);
    
    if (availableQuant > 0) {
      const plannedQuant = Math.min(remaining, availableQuant);
      positionsForPull.push({
        ...position.toObject(),
        plannedQuant,
        askId,
        askArtikul,
        askQuant,
        askRemainingQuantity,
      } as IPositionForPull);
      remaining -= plannedQuant;
    }
  }

  // Если позиций недостаточно для покрытия всего оставшегося количества,
  // все равно возвращаем все доступные позиции с их остатками
  return positionsForPull;
};

