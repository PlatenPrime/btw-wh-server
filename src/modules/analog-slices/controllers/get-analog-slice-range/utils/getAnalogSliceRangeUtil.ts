import { Analog } from "../../../../analogs/models/Analog.js";
import {
  mapSliceDocsToRangeItems,
  type SliceRangeItem,
} from "../../../../slices/utils/mapSliceDocsToRangeItems.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import type { GetAnalogSliceRangeInput } from "../schemas/getAnalogSliceRangeSchema.js";

export type { SliceRangeItem };

export type GetAnalogSliceRangeResult =
  | { ok: true; data: SliceRangeItem[] }
  | { ok: false };

/**
 * Возвращает массив данных среза по аналогу за период дат (для графиков).
 * Каждый элемент: { date: ISO string, stock, price }. Сортировка по date по возрастанию.
 * Только те даты, по которым есть срез и запись для артикула аналога.
 * ok: false — аналог не найден или у аналога пустой artikul.
 */
export async function getAnalogSliceRangeUtil(
  input: GetAnalogSliceRangeInput
): Promise<GetAnalogSliceRangeResult> {
  const analog = await Analog.findById(input.analogId)
    .select("konkName artikul")
    .lean();

  if (!analog) return { ok: false };

  const artikulKey = analog.artikul?.trim();
  if (!artikulKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const docs = await AnalogSlice.find({
    konkName: analog.konkName,
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .sort({ date: 1 })
    .lean();

  return { ok: true, data: mapSliceDocsToRangeItems(docs, artikulKey) };
}
