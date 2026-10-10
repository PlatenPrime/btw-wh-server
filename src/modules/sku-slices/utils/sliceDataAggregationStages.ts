import { toSliceDate } from "../../../utils/sliceDate.js";
import type { ISkuSliceDataItem } from "../models/skuSliceTypes.js";
import {
  loadDayMapsForKonkDates,
  loadPointsForProductIdsRange,
  loadPointsForSkusRange,
} from "./skuSliceMonthStore.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";

/** Строка «один productId» (date + урезанный data) — совместима с mapSliceDocsToRangeItems. */
export type SliceAggregateRowSingle = {
  date: Date;
  data?: Record<string, ISkuSliceDataItem>;
};

/** Строка после проекции по списку productId (для Skugr / несколько конкурентов). */
export type SliceAggregateRowWithKonk = {
  konkName: string;
  date: Date;
  data?: Record<string, ISkuSliceDataItem>;
};

/**
 * @deprecated no-op identity — оставлено для совместимости импортов тестов.
 * Данные читаются через loadSkuSlice*FromMonths.
 */
export function sliceDataProjectForSingleProductId(
  _productKey: string,
): { $project: { _id: number; date: number; data: number } } {
  return { $project: { _id: 0, date: 1, data: 1 } };
}

/**
 * @deprecated no-op identity — см. loadSkuSliceRowsForKonksProducts.
 */
export function sliceDataProjectForProductIdList(
  _allowedProductIds: string[],
): {
  $project: { _id: number; konkName: number; date: number; data: number };
} {
  return { $project: { _id: 0, konkName: 1, date: 1, data: 1 } };
}

/**
 * Ряд дней одного SKU в форме { date, data: { [productId]: item } }.
 */
export async function loadSkuSliceRowsForProduct(
  konkName: string,
  productId: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<SliceAggregateRowSingle[]> {
  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  const points = await loadPointsForProductIdsRange(
    konkName,
    [productId],
    from,
    to,
  );
  const byTime = new Map<number, ISkuSliceDataItem>();
  for (const p of points) {
    if (p.productId !== productId.trim()) continue;
    byTime.set(toSliceDate(p.date).getTime(), p.item);
  }

  const rows: SliceAggregateRowSingle[] = [];
  for (const day of enumerateReportingDates(from, to)) {
    const item = byTime.get(day.getTime());
    if (!item) continue;
    rows.push({
      date: day,
      data: { [productId.trim()]: item },
    });
  }
  return rows;
}

/**
 * Дневные документы по нескольким konk + productId (форма для buildSliceMapsByKonk).
 */
export async function loadSkuSliceRowsForKonksProducts(
  skus: Array<{ konkName: string; productId: string }>,
  dateFrom: Date,
  dateTo: Date,
): Promise<SliceAggregateRowWithKonk[]> {
  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  const points = await loadPointsForSkusRange(skus, from, to);

  const byKonkDate = new Map<string, Map<number, Record<string, ISkuSliceDataItem>>>();
  for (const p of points) {
    let byDate = byKonkDate.get(p.konkName);
    if (!byDate) {
      byDate = new Map();
      byKonkDate.set(p.konkName, byDate);
    }
    const t = toSliceDate(p.date).getTime();
    const rec = byDate.get(t) ?? {};
    rec[p.productId] = p.item;
    byDate.set(t, rec);
  }

  const rows: SliceAggregateRowWithKonk[] = [];
  for (const [konkName, byDate] of byKonkDate) {
    for (const [t, data] of byDate) {
      rows.push({ konkName, date: new Date(t), data });
    }
  }
  rows.sort(
    (a, b) =>
      a.konkName.localeCompare(b.konkName) ||
      a.date.getTime() - b.date.getTime(),
  );
  return rows;
}

/**
 * Полные дневные карты konk за диапазон (все productId в months), форма для buildSliceMapsByKonk.
 */
export async function loadSkuSliceDayDocsForKonk(
  konkName: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<SliceAggregateRowWithKonk[]> {
  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  const dates = enumerateReportingDates(from, to);
  const maps = await loadDayMapsForKonkDates(konkName, dates);
  const rows: SliceAggregateRowWithKonk[] = [];
  for (const day of dates) {
    const data = maps.get(day.getTime());
    if (!data || Object.keys(data).length === 0) continue;
    rows.push({ konkName, date: day, data });
  }
  return rows;
}

/**
 * @deprecated Используй loadSkuSliceRowsForProduct / loadSkuSliceRowsForKonksProducts.
 * Оставлено как thin shim: если pipeline начинается с $match konkName+date — грузит из months.
 */
export async function aggregateSkuSlices<
  T extends Record<string, unknown> = SliceAggregateRowSingle,
>(pipeline: Array<Record<string, unknown>>): Promise<T[]> {
  const match = pipeline.find((s) => s.$match)?.$match as
    | Record<string, unknown>
    | undefined;
  if (!match) return [];

  const konkName = match.konkName;
  const dateFilter = match.date as
    | Date
    | { $gte?: Date; $lte?: Date; $in?: Date[] }
    | undefined;

  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;
  if (dateFilter instanceof Date) {
    dateFrom = toSliceDate(dateFilter);
    dateTo = dateFrom;
  } else if (dateFilter && typeof dateFilter === "object") {
    if (dateFilter.$in?.length) {
      const times = dateFilter.$in.map((d) => toSliceDate(d).getTime()).sort();
      dateFrom = new Date(times[0]!);
      dateTo = new Date(times[times.length - 1]!);
    } else {
      if (dateFilter.$gte) dateFrom = toSliceDate(dateFilter.$gte);
      if (dateFilter.$lte) dateTo = toSliceDate(dateFilter.$lte);
    }
  }

  if (!dateFrom || !dateTo) return [];

  if (typeof konkName === "string") {
    const rows = await loadSkuSliceDayDocsForKonk(konkName, dateFrom, dateTo);
    return rows as unknown as T[];
  }

  if (
    konkName &&
    typeof konkName === "object" &&
    Array.isArray((konkName as { $in?: string[] }).$in)
  ) {
    const konks = (konkName as { $in: string[] }).$in;
    const all: SliceAggregateRowWithKonk[] = [];
    for (const kn of konks) {
      const rows = await loadSkuSliceDayDocsForKonk(kn, dateFrom, dateTo);
      all.push(...rows);
    }
    return all as unknown as T[];
  }

  return [];
}
