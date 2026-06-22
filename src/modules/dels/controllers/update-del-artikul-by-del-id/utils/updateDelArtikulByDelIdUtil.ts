import { getSharikStockData } from "../../../../browser/sharik/utils/getSharikStockData.js";
import { Del, IDel, IDelArtikulValue } from "../../../models/Del.js";

type UpdateDelArtikulByDelIdUtilInput = {
  delId: string;
  artikul: string;
};

/**
 * Обновляет stock указанного артикула в поставке данными с sharik.ua (getSharikStockData).
 * quant сохраняется; для нового артикула quant = 0.
 * Если товар не найден на sharik — возвращает null.
 */
export const updateDelArtikulByDelIdUtil = async (
  input: UpdateDelArtikulByDelIdUtilInput
): Promise<IDel | null> => {
  const del = await Del.findById(input.delId);
  if (!del) return null;

  const sharikData = await getSharikStockData(input.artikul);
  if (!sharikData) return null;

  const existing = (del.artikuls as Record<string, IDelArtikulValue>)[
    input.artikul
  ];
  const quant = existing?.quant ?? 0;

  del.set(`artikuls.${input.artikul}`, {
    quant,
    stock: sharikData.quantity,
    nameukr: sharikData.nameukr ?? "",
  });
  await del.save();
  return del;
};
