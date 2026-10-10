import type { AnyBulkWriteOperation } from "mongoose";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { isInvalidSliceStockPriceItem } from "../../slices/utils/isInvalidSliceStockPriceItem.js";
import type { IBtradeSliceDataItem } from "../models/btradeSliceTypes.js";
import {
  BtradeSliceMonth,
  type IBtradeSliceMonth,
} from "../models/BtradeSliceMonth.js";
import {
  toSliceMonthDate,
  toSliceMonthDayKey,
} from "./btradeSliceMonthKeys.js";

export type BtradeSliceDayPointWrite = {
  artikul: string;
  date: Date;
  quantity: number;
  price: number;
};

export type BtradeSliceDayPointRow = {
  artikul: string;
  quantity: number;
  price: number;
};

function readMetric(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return raw;
}

function parseDayItem(raw: unknown): IBtradeSliceDataItem | null {
  if (raw === null || raw === undefined || typeof raw !== "object") return null;
  const item = raw as { quantity?: unknown; price?: unknown };
  const quantity = readMetric(item.quantity);
  const price = readMetric(item.price);
  if (quantity === null || price === null) return null;
  return { quantity, price };
}

function buildUpsertOp(
  w: BtradeSliceDayPointWrite,
): AnyBulkWriteOperation<IBtradeSliceMonth> {
  const sliceDate = toSliceDate(w.date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const artikul = w.artikul.trim();
  return {
    updateOne: {
      filter: { artikul, month },
      update: {
        $set: {
          [`days.${dayKey}`]: { quantity: w.quantity, price: w.price },
        },
        $setOnInsert: { artikul, month },
      },
      upsert: true,
    },
  };
}

/** Атомарный upsert одной точки дня в BtradeSliceMonth. */
export async function upsertDayPoint(
  artikul: string,
  date: Date,
  item: IBtradeSliceDataItem,
): Promise<void> {
  await BtradeSliceMonth.bulkWrite(
    [
      buildUpsertOp({
        artikul,
        date,
        quantity: item.quantity,
        price: item.price,
      }),
    ],
    { ordered: false },
  );
}

/** Bulk upsert точек (cron full-day catalog). */
export async function upsertDayPointsBulk(
  writes: BtradeSliceDayPointWrite[],
): Promise<number> {
  if (writes.length === 0) return 0;
  await BtradeSliceMonth.bulkWrite(writes.map(buildUpsertOp), {
    ordered: false,
  });
  return writes.length;
}

/** Точка одного artikul на дату; null если ключа нет. */
export async function getDayPoint(
  artikul: string,
  date: Date,
): Promise<IBtradeSliceDataItem | null> {
  const sliceDate = toSliceDate(date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const key = artikul.trim();
  if (!key) return null;

  const doc = await BtradeSliceMonth.findOne({ artikul: key, month })
    .select({ [`days.${dayKey}`]: 1 })
    .lean()
    .exec();

  if (!doc?.days) return null;
  return parseDayItem(doc.days[dayKey]);
}

/**
 * Карта artikul → item за один день (для rollup / materialize).
 */
export async function loadDayMap(
  date: Date,
): Promise<Record<string, IBtradeSliceDataItem>> {
  const sliceDate = toSliceDate(date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);

  const docs = await BtradeSliceMonth.find({ month })
    .select({ artikul: 1, [`days.${dayKey}`]: 1 })
    .lean()
    .exec();

  const out: Record<string, IBtradeSliceDataItem> = {};
  for (const doc of docs) {
    const item = parseDayItem(doc.days?.[dayKey]);
    if (!item) continue;
    const artikul = (doc.artikul ?? "").trim();
    if (!artikul) continue;
    out[artikul] = item;
  }
  return out;
}

/**
 * Несколько дневных карт. Ключ внешней Map — getTime() UTC-суток sliceDate.
 */
export async function loadDayMaps(
  dates: Date[],
): Promise<Map<number, Record<string, IBtradeSliceDataItem>>> {
  const out = new Map<number, Record<string, IBtradeSliceDataItem>>();
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

  const docs = await BtradeSliceMonth.find({ month: { $in: months } })
    .select("artikul days")
    .lean()
    .exec();

  for (const t of uniqueTimes) {
    out.set(t, {});
  }

  for (const doc of docs) {
    const artikul = (doc.artikul ?? "").trim();
    if (!artikul) continue;
    const days = doc.days ?? {};
    for (const dayKey of dayKeysNeeded) {
      const item = parseDayItem(days[dayKey]);
      if (!item) continue;
      const t = Date.parse(`${dayKey}T00:00:00.000Z`);
      if (!out.has(t)) continue;
      out.get(t)![artikul] = item;
    }
  }

  return out;
}

/**
 * Точки нескольких artikul за диапазон дат.
 */
export async function loadPointsForArtikulsRange(
  artikuls: string[],
  dateFrom: Date,
  dateTo: Date,
): Promise<
  Array<{ artikul: string; date: Date; item: IBtradeSliceDataItem }>
> {
  const keys = [...new Set(artikuls.map((a) => a.trim()).filter(Boolean))];
  if (keys.length === 0) return [];

  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  if (from.getTime() > to.getTime()) return [];

  const monthFrom = toSliceMonthDate(from);
  const monthTo = toSliceMonthDate(to);
  const fromKey = toSliceMonthDayKey(from);
  const toKey = toSliceMonthDayKey(to);

  const docs = await BtradeSliceMonth.find({
    artikul: { $in: keys },
    month: { $gte: monthFrom, $lte: monthTo },
  })
    .select("artikul days")
    .lean()
    .exec();

  const out: Array<{ artikul: string; date: Date; item: IBtradeSliceDataItem }> =
    [];

  for (const doc of docs) {
    const artikul = (doc.artikul ?? "").trim();
    if (!artikul) continue;
    const days = doc.days ?? {};
    for (const [dayKey, raw] of Object.entries(days)) {
      if (dayKey < fromKey || dayKey > toKey) continue;
      const item = parseDayItem(raw);
      if (!item) continue;
      out.push({
        artikul,
        date: new Date(`${dayKey}T00:00:00.000Z`),
        item,
      });
    }
  }

  return out;
}

export type FindBtradeDayPointsPageInput = {
  date: Date;
  page: number;
  limit: number;
  isInvalid?: boolean;
};

export type FindBtradeDayPointsPageResult = {
  date: Date;
  items: BtradeSliceDayPointRow[];
  total: number;
};

/**
 * Пагинация точек за день. Без isInvalid — все ключи дня; с isInvalid — проблемные.
 */
export async function findDayPointsPage(
  input: FindBtradeDayPointsPageInput,
): Promise<FindBtradeDayPointsPageResult> {
  const sliceDate = toSliceDate(input.date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const page = Math.max(1, input.page);
  const limit = Math.max(1, input.limit);

  const docs = await BtradeSliceMonth.find({ month })
    .select({ artikul: 1, [`days.${dayKey}`]: 1 })
    .lean()
    .exec();

  const rows: BtradeSliceDayPointRow[] = [];
  for (const doc of docs) {
    const item = parseDayItem(doc.days?.[dayKey]);
    if (!item) continue;
    const artikul = (doc.artikul ?? "").trim();
    if (!artikul) continue;
    if (
      input.isInvalid === true &&
      !isInvalidSliceStockPriceItem(item.quantity, item.price)
    ) {
      continue;
    }
    rows.push({ artikul, quantity: item.quantity, price: item.price });
  }

  rows.sort((a, b) => a.artikul.localeCompare(b.artikul));
  const total = rows.length;
  const skip = (page - 1) * limit;
  const items = rows.slice(skip, skip + limit);

  return { date: sliceDate, items, total };
}
