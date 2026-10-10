import type { AnyBulkWriteOperation } from "mongoose";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { BtradeSlice } from "../models/BtradeSlice.js";
import {
  BtradeSliceMonth,
  type IBtradeSliceMonth,
} from "../models/BtradeSliceMonth.js";
import {
  toSliceMonthDate,
  toSliceMonthDayKey,
} from "./btradeSliceMonthKeys.js";

export type MigrateAllBtradeSlicesToMonthsProgress = {
  sliceIndex: number;
  slicesTotal: number;
  date: string;
  keysInSlice: number;
  dayWritesCumulative: number;
  apply: boolean;
};

export type MigrateAllBtradeSlicesToMonthsInput = {
  apply?: boolean;
  onProgress?: (info: MigrateAllBtradeSlicesToMonthsProgress) => void;
};

export type MigrateAllBtradeSlicesToMonthsResult = {
  apply: boolean;
  slicesTotal: number;
  slicesRead: number;
  dayWritesWouldWrite: number;
  dayWritesUpserted: number;
  monthsTouched: number;
};

export type VerifyRandomBtradeSlicesVsMonthsResult = {
  sampleSize: number;
  compared: number;
  mismatches: Array<{
    date: string;
    artikul: string;
    legacy?: { quantity: number; price: number };
    month?: { quantity: number; price: number };
    reason: string;
  }>;
  ok: boolean;
};

type SliceLean = {
  date: Date;
  data?: Record<string, { quantity?: unknown; price?: unknown } | unknown>;
};

type DayWrite = {
  artikul: string;
  month: Date;
  dayKey: string;
  quantity: number;
  price: number;
};

function toYmd(d: Date): string {
  return toSliceDate(d).toISOString().slice(0, 10);
}

function monthTouchKey(w: DayWrite): string {
  return `${w.artikul}|${toYmd(w.month).slice(0, 7)}`;
}

function readMetric(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return raw;
}

function dayWritesFromSliceData(slice: SliceLean): DayWrite[] {
  const data = slice.data;
  if (!data || typeof data !== "object") return [];

  const sliceDate = toSliceDate(slice.date);
  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const out: DayWrite[] = [];

  for (const [rawKey, rawItem] of Object.entries(data)) {
    const artikul = rawKey.trim();
    if (!artikul) continue;
    if (rawItem === null || rawItem === undefined || typeof rawItem !== "object") {
      continue;
    }
    const item = rawItem as { quantity?: unknown; price?: unknown };
    const quantity = readMetric(item.quantity);
    const price = readMetric(item.price);
    if (quantity === null || price === null) continue;
    out.push({ artikul, month, dayKey, quantity, price });
  }

  return out;
}

function buildUpsertOps(
  writes: DayWrite[],
): AnyBulkWriteOperation<IBtradeSliceMonth>[] {
  return writes.map((w) => ({
    updateOne: {
      filter: { artikul: w.artikul, month: w.month },
      update: {
        $set: {
          [`days.${w.dayKey}`]: { quantity: w.quantity, price: w.price },
        },
        $setOnInsert: { artikul: w.artikul, month: w.month },
      },
      upsert: true,
    },
  }));
}

/**
 * Полный перенос всех legacy BtradeSlice → BtradeSliceMonth (overwrite дней).
 */
export async function migrateAllBtradeSlicesToMonthsUtil(
  input: MigrateAllBtradeSlicesToMonthsInput = {},
): Promise<MigrateAllBtradeSlicesToMonthsResult> {
  const apply = input.apply === true;
  const slicesTotal = await BtradeSlice.countDocuments({});
  const monthsTouchedSet = new Set<string>();
  let dayWritesWouldWrite = 0;
  let dayWritesUpserted = 0;
  let sliceIndex = 0;

  const cursor = BtradeSlice.find({})
    .select("date data")
    .lean()
    .cursor();

  for await (const raw of cursor) {
    const slice = raw as SliceLean;
    sliceIndex += 1;
    const writes = dayWritesFromSliceData(slice);
    dayWritesWouldWrite += writes.length;
    for (const w of writes) {
      monthsTouchedSet.add(monthTouchKey(w));
    }

    if (apply && writes.length > 0) {
      await BtradeSliceMonth.bulkWrite(buildUpsertOps(writes), {
        ordered: false,
      });
      dayWritesUpserted += writes.length;
    }

    input.onProgress?.({
      sliceIndex,
      slicesTotal,
      date: toYmd(slice.date),
      keysInSlice: writes.length,
      dayWritesCumulative: apply ? dayWritesUpserted : dayWritesWouldWrite,
      apply,
    });
  }

  return {
    apply,
    slicesTotal,
    slicesRead: sliceIndex,
    dayWritesWouldWrite,
    dayWritesUpserted: apply ? dayWritesUpserted : 0,
    monthsTouched: monthsTouchedSet.size,
  };
}

/**
 * Сверяет sampleSize случайных legacy дневных срезов с months.
 */
export async function verifyRandomBtradeSlicesVsMonths(
  sampleSize = 100,
): Promise<VerifyRandomBtradeSlicesVsMonthsResult> {
  const total = await BtradeSlice.countDocuments({});
  const n = Math.min(sampleSize, total);
  const mismatches: VerifyRandomBtradeSlicesVsMonthsResult["mismatches"] = [];

  if (n === 0) {
    return { sampleSize: n, compared: 0, mismatches, ok: true };
  }

  const sampled = (await BtradeSlice.aggregate([
    { $sample: { size: n } },
    { $project: { date: 1, data: 1 } },
  ])) as SliceLean[];

  let compared = 0;

  for (const slice of sampled) {
    const writes = dayWritesFromSliceData(slice);
    const dayKey = toSliceMonthDayKey(toSliceDate(slice.date));
    const month = toSliceMonthDate(toSliceDate(slice.date));

    for (const w of writes) {
      compared += 1;
      const doc = await BtradeSliceMonth.findOne({
        artikul: w.artikul,
        month,
      })
        .select({ [`days.${dayKey}`]: 1 })
        .lean();

      const monthItem = doc?.days?.[dayKey] as
        | { quantity?: number; price?: number }
        | undefined;

      if (!monthItem) {
        mismatches.push({
          date: dayKey,
          artikul: w.artikul,
          legacy: { quantity: w.quantity, price: w.price },
          reason: "missing_in_months",
        });
        continue;
      }

      if (monthItem.quantity !== w.quantity || monthItem.price !== w.price) {
        mismatches.push({
          date: dayKey,
          artikul: w.artikul,
          legacy: { quantity: w.quantity, price: w.price },
          month: {
            quantity: monthItem.quantity as number,
            price: monthItem.price as number,
          },
          reason: "value_mismatch",
        });
      }
    }
  }

  return {
    sampleSize: n,
    compared,
    mismatches,
    ok: mismatches.length === 0,
  };
}
