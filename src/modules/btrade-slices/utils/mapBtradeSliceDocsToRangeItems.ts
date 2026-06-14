import type { IBtradeSliceDataItem } from "../models/BtradeSlice.js";

export type BtradeSliceRangeItem = {
  date: string;
  quantity: number;
  price: number;
};

type BtradeSliceDocWithData = {
  date: Date;
  data?: Record<string, IBtradeSliceDataItem | undefined> | unknown;
};

/**
 * Преобразует документы Btrade-среза за период в массив точек для графиков.
 * Только те даты, по которым есть запись для artikul.
 */
export function mapBtradeSliceDocsToRangeItems(
  docs: BtradeSliceDocWithData[],
  artikulKey: string,
): BtradeSliceRangeItem[] {
  const data: BtradeSliceRangeItem[] = [];
  for (const doc of docs) {
    const dataRecord = (doc.data ?? {}) as Record<
      string,
      IBtradeSliceDataItem | undefined
    >;
    const item = dataRecord[artikulKey];
    if (!item) continue;
    data.push({
      date: doc.date.toISOString(),
      quantity: item.quantity,
      price: item.price,
    });
  }
  return data;
}
