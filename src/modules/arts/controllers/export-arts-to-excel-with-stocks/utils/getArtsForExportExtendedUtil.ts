import { Art, IArt } from "../../../models/Art.js";

/**
 * Получает все артикулы из базы данных для расширенного экспорта
 * Включает поле btradeStock для расчета витрины
 * @returns Promise с массивом всех артикулов
 */
export const getArtsForExportExtendedUtil = async (): Promise<IArt[]> => {
  const arts: IArt[] = await Art.find()
    .sort({ artikul: 1 })
    .select(
      "artikul nameukr namerus zone limit marker btradeStock createdAt updatedAt"
    )
    .lean();
  return arts;
};
