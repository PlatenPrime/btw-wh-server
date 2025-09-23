import { Pos } from "../models/Pos.js";
import { mergePoses } from "./mergePoses.js";

/**
 * Получает и объединяет позиции склада с ненулевым количеством
 * @param sklad - Название склада (по умолчанию "pogrebi")
 * @returns Объект с объединенными позициями по артикулам
 */
export async function getSkladStocks(sklad: string = "pogrebi") {
  try {
    // Находим все позиции склада с ненулевым количеством
    const poses = await Pos.find({
      sklad,
      quant: { $ne: 0 },
    }).exec();

    // Объединяем позиции с помощью функции mergePoses
    const mergedPoses = mergePoses(poses);

    return mergedPoses;
  } catch (error) {
    console.error(`Ошибка при получении позиций склада ${sklad}:`, error);
    throw error;
  }
}
