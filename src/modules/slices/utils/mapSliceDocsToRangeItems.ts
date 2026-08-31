import { enumerateSliceDates } from "./enumerateSliceDates.js";
import { isValidSliceMetricValue } from "./isInvalidSliceStockResult.js";

export type SliceRangeItem = { date: string; stock: number; price: number };

export type SliceRangeMapOptions = {
  dateFrom: Date;
  dateTo: Date;
};

type SliceDocWithData = {
  date: Date;
  data?:
    | Record<string, { stock: number; price: number } | undefined>
    | unknown;
};

function sliceDateMinusDays(sliceDate: Date, days: number): Date {
  const d = new Date(sliceDate);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function toMetricOrZero(value: number | null): number {
  return value ?? 0;
}

function mapSliceDocsToSparseRangeItems(
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

function mapSliceDocsToDenseRangeItems(
  docs: SliceDocWithData[],
  productKey: string,
  range: SliceRangeMapOptions,
): SliceRangeItem[] {
  const byDate = new Map<number, { stock: number; price: number }>();
  for (const doc of docs) {
    const dataRecord = (doc.data ?? {}) as Record<
      string,
      { stock: number; price: number } | undefined
    >;
    const item = dataRecord[productKey];
    if (!item) continue;
    byDate.set(doc.date.getTime(), item);
  }

  const warmStart = sliceDateMinusDays(range.dateFrom, 1);
  const datesFull = enumerateSliceDates(warmStart, range.dateTo);
  const datesReport = enumerateSliceDates(range.dateFrom, range.dateTo);

  let lastStock: number | null = null;
  let lastPrice: number | null = null;
  const coalescedByTime = new Map<number, { stock: number; price: number }>();

  for (const d of datesFull) {
    const item = byDate.get(d.getTime());
    const rawS = item?.stock;
    const rawP = item?.price;
    if (isValidSliceMetricValue(rawS)) lastStock = rawS;
    if (isValidSliceMetricValue(rawP)) lastPrice = rawP;
    coalescedByTime.set(d.getTime(), {
      stock: toMetricOrZero(lastStock),
      price: toMetricOrZero(lastPrice),
    });
  }

  return datesReport.map((d) => {
    const point = coalescedByTime.get(d.getTime()) ?? { stock: 0, price: 0 };
    return {
      date: d.toISOString(),
      stock: point.stock,
      price: point.price,
    };
  });
}

/**
 * Преобразует документы среза за период в массив точек для графиков.
 * Без `range` — только даты с записью productKey (sparse).
 * С `range` — плотный ряд по каждому UTC-дню dateFrom..dateTo с forward-fill пропусков и -1;
 * warm-start — день до dateFrom; до первого валидного среза — stock/price 0.
 */
export function mapSliceDocsToRangeItems(
  docs: SliceDocWithData[],
  productKey: string,
  range?: SliceRangeMapOptions,
): SliceRangeItem[] {
  if (range) {
    return mapSliceDocsToDenseRangeItems(docs, productKey, range);
  }
  return mapSliceDocsToSparseRangeItems(docs, productKey);
}
