import { Analog } from "../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import type { IAnalogSliceDataItem } from "../../../models/AnalogSlice.js";
import { toSliceDate } from "../../../utils/runAnalogSliceForKonkUtil.js";
import type { GetAnalogSliceByDateInput } from "../schemas/getAnalogSliceByDateSchema.js";

export type SliceByDateResult = { stock: number; price: number };

/**
 * Возвращает данные среза (stock, price) по аналогу на конкретную дату.
 * Аналог определяется по _id; для поиска в срезе используются konkName и artikul.
 * Если аналог не найден, у аналога пустой artikul или среза/записи по артикулу нет — возвращает null.
 */
export async function getAnalogSliceByDateUtil(
  input: GetAnalogSliceByDateInput
): Promise<SliceByDateResult | null> {
  const analog = await Analog.findById(input.analogId)
    .select("konkName artikul")
    .lean();

  if (!analog) return null;

  const artikulKey = analog.artikul?.trim();
  if (!artikulKey) return null;

  const sliceDate = toSliceDate(input.date);
  const doc = await AnalogSlice.findOne({
    konkName: analog.konkName,
    date: sliceDate,
  })
    .select("data")
    .lean();

  if (!doc?.data) return null;

  const item = (doc.data as Record<string, IAnalogSliceDataItem>)[artikulKey];
  if (!item) return null;

  return { stock: item.stock, price: item.price };
}
