import { IPositionForPull } from "../../get-ask-pull/types/getAskPullResponse.js";
import { getPositionSectorUtil } from "../../../../poses/utils/sort-positions-by-pallet-sector-util/getPositionSector.js";
import { IPositionsBySector } from "../types/getAsksPullsResponse.js";

/**
 * Группирует позиции по секторам паллет и сортирует сектора по возрастанию
 * @param positions - Массив позиций для группировки
 * @returns Массив групп позиций, отсортированный по секторам
 */
export const groupPositionsBySectorUtil = (
  positions: IPositionForPull[]
): IPositionsBySector[] => {
  if (positions.length === 0) {
    return [];
  }

  // Группируем позиции по сектору
  const positionsBySectorMap = new Map<number, IPositionForPull[]>();

  for (const position of positions) {
    const sector = getPositionSectorUtil(position);
    const existingPositions = positionsBySectorMap.get(sector) || [];
    existingPositions.push(position);
    positionsBySectorMap.set(sector, existingPositions);
  }

  // Преобразуем Map в массив и сортируем по секторам
  const result: IPositionsBySector[] = Array.from(
    positionsBySectorMap.entries()
  )
    .map(([sector, positions]) => ({
      sector,
      positions,
    }))
    .sort((a, b) => a.sector - b.sector);

  return result;
};

