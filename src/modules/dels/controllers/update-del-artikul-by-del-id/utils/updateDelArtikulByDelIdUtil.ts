import { getSharikStockData } from "../../../../browser/sharik/utils/getSharikStockData.js";
import { Del, IDel } from "../../../models/Del.js";

type UpdateDelArtikulByDelIdUtilInput = {
  delId: string;
  artikul: string;
};

/**
 * Обновляет значение указанного артикула в поставке данными с sharik.ua (getSharikStockData).
 * Если артикула нет в поставке — добавляет его. Если товар не найден на sharik — возвращает null.
 */
export const updateDelArtikulByDelIdUtil = async (
  input: UpdateDelArtikulByDelIdUtilInput
): Promise<IDel | null> => {
  const del = await Del.findById(input.delId);
  if (!del) return null;

  const sharikData = await getSharikStockData(input.artikul);
  if (!sharikData) return null;

  del.set(`artikuls.${input.artikul}`, {
    quantity: sharikData.quantity,
    nameukr: sharikData.nameukr ?? "",
  });
  await del.save();
  return del;
};
