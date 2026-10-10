import type { AnyBulkWriteOperation } from "mongoose";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { isInvalidSliceStockPriceItem } from "../../slices/utils/isInvalidSliceStockPriceItem.js";
import type { ISkuSliceDataItem } from "../models/skuSliceTypes.js";
import {
  SkuSliceMonth,
  type ISkuSliceMonth,
} from "../models/SkuSliceMonth.js";
import { isSkuSliceDataKeyFilled } from "./isSkuSliceDataKeyFilled.js";
import {
  toSliceMonthDate,
  toSliceMonthDayKey,
} from "./skuSliceMonthKeys.js";

export type SkuSliceDayPointWrite = {
  konkName: string;
  productId: string;
  date: Date;
  stock: number;
  price: number;
};

export type SkuSliceDayPointRow = {
  productId: string;
  stock: number;
  price: number;
};

function readMetric(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return raw;
}

function parseDayItem(raw: unknown): ISkuSliceDataItem | null {
  if (raw === null || raw === undefined || typeof raw !== "object") return null;
  const item = raw as { stock?: unknown; price?: unknown };
  const stock = readMetric(item.stock);
  const price = readMetric(item.price);
  if (stock === null || price === null) return null;
  return { stock, price };
}

function buildUpsertOp(
  w: SkuSliceDayPointWrite,
): AnyBulkWriteOperation<ISkuSliceMonth> {
  const sliceDate = toSliceDate(w.date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const productId = w.productId.trim();
  return {
    updateOne: {
      filter: {
        konkName: w.konkName,
        productId,
        month,
      },
      update: {
        $set: {
          [`days.${dayKey}`]: { stock: w.stock, price: w.price },
        },
        $setOnInsert: {
          konkName: w.konkName,
          productId,
          month,
        },
      },
      upsert: true,
    },
  };
}

/** Атомарный upsert одной точки дня в SkuSliceMonth. */
export async function upsertDayPoint(
  konkName: string,
  productId: string,
  date: Date,
  item: ISkuSliceDataItem,
): Promise<void> {
  await SkuSliceMonth.bulkWrite(
    [
      buildUpsertOp({
        konkName,
        productId,
        date,
        stock: item.stock,
        price: item.price,
      }),
    ],
    { ordered: false },
  );
}

/** Bulk upsert точек (scrape / patch range). */
export async function upsertDayPointsBulk(
  writes: SkuSliceDayPointWrite[],
): Promise<number> {
  if (writes.length === 0) return 0;
  await SkuSliceMonth.bulkWrite(writes.map(buildUpsertOp), { ordered: false });
  return writes.length;
}

/** Точка одного SKU на дату; null если ключа нет. */
export async function getDayPoint(
  konkName: string,
  productId: string,
  date: Date,
): Promise<ISkuSliceDataItem | null> {
  const sliceDate = toSliceDate(date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const pid = productId.trim();
  if (!pid) return null;

  const doc = await SkuSliceMonth.findOne({
    konkName,
    productId: pid,
    month,
  })
    .select({ [`days.${dayKey}`]: 1 })
    .lean()
    .exec();

  if (!doc?.days) return null;
  return parseDayItem(doc.days[dayKey]);
}

/**
 * Ряд точек одного SKU за диапазон дат (включительно).
 * Возвращает Map dayKey → item только для существующих ключей.
 */
export async function getPointsForSkuRange(
  konkName: string,
  productId: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<Map<string, ISkuSliceDataItem>> {
  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  const pid = productId.trim();
  const out = new Map<string, ISkuSliceDataItem>();
  if (!pid || from.getTime() > to.getTime()) return out;

  const monthFrom = toSliceMonthDate(from);
  const monthTo = toSliceMonthDate(to);

  const docs = await SkuSliceMonth.find({
    konkName,
    productId: pid,
    month: { $gte: monthFrom, $lte: monthTo },
  })
    .select("days month")
    .lean()
    .exec();

  const fromKey = toSliceMonthDayKey(from);
  const toKey = toSliceMonthDayKey(to);

  for (const doc of docs) {
    const days = doc.days ?? {};
    for (const [dayKey, raw] of Object.entries(days)) {
      if (dayKey < fromKey || dayKey > toKey) continue;
      const item = parseDayItem(raw);
      if (item) out.set(dayKey, item);
    }
  }
  return out;
}

/**
 * Карта productId → item за один день konk (для rollup / compensation / corrections).
 */
export async function loadDayMapForKonk(
  konkName: string,
  date: Date,
): Promise<Record<string, ISkuSliceDataItem>> {
  const sliceDate = toSliceDate(date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);

  const docs = await SkuSliceMonth.find({ konkName, month })
    .select({ productId: 1, [`days.${dayKey}`]: 1 })
    .lean()
    .exec();

  const out: Record<string, ISkuSliceDataItem> = {};
  for (const doc of docs) {
    const item = parseDayItem(doc.days?.[dayKey]);
    if (!item) continue;
    const pid = (doc.productId ?? "").trim();
    if (!pid) continue;
    out[pid] = item;
  }
  return out;
}

/**
 * Несколько дневных карт для одного konk (lookback окна).
 * Ключ внешней Map — getTime() UTC-суток sliceDate.
 */
export async function loadDayMapsForKonkDates(
  konkName: string,
  dates: Date[],
): Promise<Map<number, Record<string, ISkuSliceDataItem>>> {
  const out = new Map<number, Record<string, ISkuSliceDataItem>>();
  if (dates.length === 0) return out;

  const sliceDates = dates.map((d) => toSliceDate(d));
  const uniqueTimes = [...new Set(sliceDates.map((d) => d.getTime()))].sort(
    (a, b) => a - b,
  );
  const uniqueDates = uniqueTimes.map((t) => new Date(t));

  const months = [
    ...new Set(uniqueDates.map((d) => toSliceMonthDate(d).getTime())),
  ].map((t) => new Date(t));

  const dayKeysNeeded = new Set(uniqueDates.map((d) => toSliceMonthDayKey(d)));

  const docs = await SkuSliceMonth.find({
    konkName,
    month: { $in: months },
  })
    .select("productId days")
    .lean()
    .exec();

  for (const t of uniqueTimes) {
    out.set(t, {});
  }

  for (const doc of docs) {
    const pid = (doc.productId ?? "").trim();
    if (!pid) continue;
    const days = doc.days ?? {};
    for (const dayKey of dayKeysNeeded) {
      const item = parseDayItem(days[dayKey]);
      if (!item) continue;
      const t = Date.parse(`${dayKey}T00:00:00.000Z`);
      if (!out.has(t)) continue;
      out.get(t)![pid] = item;
    }
  }

  return out;
}

export type FindDayPointsPageInput = {
  konkName: string;
  date: Date;
  page: number;
  limit: number;
  /** true — только invalid по isInvalidSliceStockPriceItem */
  isInvalid?: boolean;
};

export type FindDayPointsPageResult = {
  konkName: string;
  date: Date;
  items: SkuSliceDayPointRow[];
  total: number;
};

/**
 * Пагинация точек за день. Без isInvalid — все ключи дня; с isInvalid — проблемные.
 */
export async function findDayPointsPage(
  input: FindDayPointsPageInput,
): Promise<FindDayPointsPageResult> {
  const sliceDate = toSliceDate(input.date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const page = Math.max(1, input.page);
  const limit = Math.max(1, input.limit);

  const docs = await SkuSliceMonth.find({
    konkName: input.konkName,
    month,
  })
    .select({ productId: 1, [`days.${dayKey}`]: 1 })
    .lean()
    .exec();

  const rows: SkuSliceDayPointRow[] = [];
  for (const doc of docs) {
    const item = parseDayItem(doc.days?.[dayKey]);
    if (!item) continue;
    const productId = (doc.productId ?? "").trim();
    if (!productId) continue;
    if (
      input.isInvalid === true &&
      !isInvalidSliceStockPriceItem(item.stock, item.price)
    ) {
      continue;
    }
    rows.push({ productId, stock: item.stock, price: item.price });
  }

  rows.sort((a, b) => a.productId.localeCompare(b.productId));
  const total = rows.length;
  const skip = (page - 1) * limit;
  const items = rows.slice(skip, skip + limit);

  return {
    konkName: input.konkName,
    date: sliceDate,
    items,
    total,
  };
}

/** Есть ли валидная (не -1) точка на день. */
export async function isDayPointFilled(
  konkName: string,
  productId: string,
  date: Date,
): Promise<boolean> {
  const item = await getDayPoint(konkName, productId, date);
  return isSkuSliceDataKeyFilled(item);
}

/**
 * Загрузить точки для набора productId на одну дату (air pending / skugr).
 */
export async function loadDayPointsForProductIds(
  konkName: string,
  productIds: string[],
  date: Date,
): Promise<Record<string, ISkuSliceDataItem>> {
  const pids = [
    ...new Set(productIds.map((p) => p.trim()).filter(Boolean)),
  ];
  if (pids.length === 0) return {};

  const sliceDate = toSliceDate(date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);

  const docs = await SkuSliceMonth.find({
    konkName,
    productId: { $in: pids },
    month,
  })
    .select({ productId: 1, [`days.${dayKey}`]: 1 })
    .lean()
    .exec();

  const out: Record<string, ISkuSliceDataItem> = {};
  for (const doc of docs) {
    const item = parseDayItem(doc.days?.[dayKey]);
    if (!item) continue;
    const pid = (doc.productId ?? "").trim();
    if (!pid) continue;
    out[pid] = item;
  }
  return out;
}

/**
 * Точки нескольких productId за диапазон дат (reporting / charts).
 * Возвращает lean-подобные строки { productId, date, item } для каждого существующего дня.
 */
export async function loadPointsForProductIdsRange(
  konkName: string,
  productIds: string[],
  dateFrom: Date,
  dateTo: Date,
): Promise<
  Array<{ productId: string; date: Date; item: ISkuSliceDataItem }>
> {
  const pids = [
    ...new Set(productIds.map((p) => p.trim()).filter(Boolean)),
  ];
  if (pids.length === 0) return [];

  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  if (from.getTime() > to.getTime()) return [];

  const monthFrom = toSliceMonthDate(from);
  const monthTo = toSliceMonthDate(to);
  const fromKey = toSliceMonthDayKey(from);
  const toKey = toSliceMonthDayKey(to);

  const docs = await SkuSliceMonth.find({
    konkName,
    productId: { $in: pids },
    month: { $gte: monthFrom, $lte: monthTo },
  })
    .select("productId days")
    .lean()
    .exec();

  const out: Array<{ productId: string; date: Date; item: ISkuSliceDataItem }> =
    [];

  for (const doc of docs) {
    const productId = (doc.productId ?? "").trim();
    if (!productId) continue;
    const days = doc.days ?? {};
    for (const [dayKey, raw] of Object.entries(days)) {
      if (dayKey < fromKey || dayKey > toKey) continue;
      const item = parseDayItem(raw);
      if (!item) continue;
      out.push({
        productId,
        date: new Date(`${dayKey}T00:00:00.000Z`),
        item,
      });
    }
  }

  return out;
}

/**
 * Точки нескольких konk + productId за диапазон (skugr multi-konk).
 */
export async function loadPointsForSkusRange(
  skus: Array<{ konkName: string; productId: string }>,
  dateFrom: Date,
  dateTo: Date,
): Promise<
  Array<{
    konkName: string;
    productId: string;
    date: Date;
    item: ISkuSliceDataItem;
  }>
> {
  if (skus.length === 0) return [];

  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  if (from.getTime() > to.getTime()) return [];

  const byKonk = new Map<string, Set<string>>();
  for (const s of skus) {
    const pid = s.productId.trim();
    if (!pid) continue;
    const set = byKonk.get(s.konkName) ?? new Set();
    set.add(pid);
    byKonk.set(s.konkName, set);
  }

  const out: Array<{
    konkName: string;
    productId: string;
    date: Date;
    item: ISkuSliceDataItem;
  }> = [];

  for (const [konkName, pidSet] of byKonk) {
    const rows = await loadPointsForProductIdsRange(
      konkName,
      [...pidSet],
      from,
      to,
    );
    for (const row of rows) {
      out.push({ konkName, ...row });
    }
  }

  return out;
}

/** Patch только stock (balun); price не трогаем. */
export async function upsertDayStockOnly(
  konkName: string,
  productId: string,
  date: Date,
  stock: number,
): Promise<boolean> {
  const existing = await getDayPoint(konkName, productId, date);
  if (!existing) return false;
  await upsertDayPoint(konkName, productId, date, {
    stock,
    price: existing.price,
  });
  return true;
}
