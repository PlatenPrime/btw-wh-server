import { Art, IArt } from "../../../models/Art.js";

/**
 * Получает все артикулы из базы данных для экспорта
 * @returns Promise с массивом всех артикулов
 */
export const getArtsForExportUtil = async (): Promise<IArt[]> => {
  const arts: IArt[] = await Art.find()
    .sort({ artikul: 1 })
    .select(
      "artikul nameukr namerus zone limit marker btradeStock "
    )
    .lean();
  return arts;
};

