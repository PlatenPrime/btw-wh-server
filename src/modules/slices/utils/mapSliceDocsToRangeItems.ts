export type SliceRangeItem = { date: string; stock: number; price: number };

type SliceDocWithData = {
  date: Date;
  data?:
    | Record<string, { stock: number; price: number } | undefined>
    | unknown;
};

/**
 * Преобразует документы среза за период в массив точек для графиков.
 * Только те даты, по которым есть запись для productKey.
 */
export function mapSliceDocsToRangeItems(
  docs: SliceDocWithData[],
  productKey: string,
): SliceRangeItem[] {
  const data: SliceRangeItem[] = [];
  for (const doc of docs) {
    const dataRecord = (doc.data ?? {}) as Record<
      string,
      { stock: number; price: number } | undefined
    >;
    const item = dataRecord[productKey];
    if (!item) continue;
    data.push({
      date: doc.date.toISOString(),
      stock: item.stock,
      price: item.price,
    });
  }
  return data;
}
