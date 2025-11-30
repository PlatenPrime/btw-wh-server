import { sortPosesByPalletSector } from "../../../../pallets/utils/sortPosesByPalletSector.js";
import { GetPosesByArtikulResponse } from "../../../types/getPosesByArtikulResponse.js";
import { calculateWarehouseDataUtil } from "./calculateWarehouseDataUtil.js";
import { getPosesByArtikulUtil } from "./getPosesByArtikulUtil.js";
import { groupPosesByWarehouseUtil } from "./groupPosesByWarehouseUtil.js";

/**
 * Обрабатывает позиции по артикулу: получает, группирует по складам,
 * сортирует по сектору паллеты и рассчитывает итоговые данные
 * @param artikul - Артикул для поиска позиций
 * @returns Ответ с обработанными данными по позициям
 */
export const processPosesByArtikulUtil = async (
  artikul: string
): Promise<GetPosesByArtikulResponse> => {
  // Получаем позиции
  const poses = await getPosesByArtikulUtil(artikul);

  // Если позиций нет, возвращаем пустой ответ
  if (poses.length === 0) {
    return {
      total: 0,
      pogrebi: { poses: [], quant: 0, boxes: 0 },
      merezhi: { poses: [], quant: 0, boxes: 0 },
      totalQuant: 0,
      totalBoxes: 0,
    };
  }

  // Группируем по складам
  const { pogrebi: pogrebiPoses, merezhi: merezhiPoses } =
    groupPosesByWarehouseUtil(poses);

  // Сортируем по сектору паллеты
  sortPosesByPalletSector(pogrebiPoses);
  sortPosesByPalletSector(merezhiPoses);

  // Рассчитываем данные по складам
  const pogrebi = calculateWarehouseDataUtil(pogrebiPoses);
  const merezhi = calculateWarehouseDataUtil(merezhiPoses);

  // Рассчитываем общие суммы
  const totalQuant = poses.reduce((sum: number, pos) => sum + pos.quant, 0);
  const totalBoxes = poses.reduce((sum: number, pos) => sum + pos.boxes, 0);

  return {
    total: poses.length,
    pogrebi,
    merezhi,
    totalQuant,
    totalBoxes,
  };
};
