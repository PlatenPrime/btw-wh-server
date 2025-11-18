import { Pos } from "../../../../poses/models/Pos.js";

/**
 * Получает сумму quant из всех позиций, сгруппированных по artikul
 * Использует MongoDB агрегацию для эффективного получения данных
 * @returns Promise с Map, где ключ - artikul, значение - сумма quant
 */
export const getPosesQuantByArtikulUtil = async (): Promise<
  Map<string, number>
> => {
  const aggregationResult = await Pos.aggregate([
    {
      $group: {
        _id: "$artikul",
        totalQuant: { $sum: "$quant" },
      },
    },
  ]);

  // Преобразуем результат агрегации в Map для O(1) поиска
  const posesQuantMap = new Map<string, number>();
  aggregationResult.forEach((item) => {
    if (item._id && typeof item.totalQuant === "number") {
      posesQuantMap.set(item._id, item.totalQuant);
    }
  });

  return posesQuantMap;
};

