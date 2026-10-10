import type { AnyBulkWriteOperation } from "mongoose";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { SkuSlice } from "../models/SkuSlice.js";
import {
  SkuSliceMonth,
  type ISkuSliceMonth,
} from "../models/SkuSliceMonth.js";
import {
  toSliceMonthDate,
  toSliceMonthDayKey,
} from "./skuSliceMonthKeys.js";

export type MigrateAllSkuSlicesToMonthsProgress = {
  sliceIndex: number;
  slicesTotal: number;
  konkName: string;
  date: string;
  keysInSlice: number;
  dayWritesCumulative: number;
  apply: boolean;
};

export type MigrateAllSkuSlicesToMonthsInput = {
  apply?: boolean;
  konkName?: string;
  onProgress?: (info: MigrateAllSkuSlicesToMonthsProgress) => void;
};

export type MigrateAllSkuSlicesToMonthsResult = {
  apply: boolean;
  slicesTotal: number;
  slicesRead: number;
  dayWritesWouldWrite: number;
  dayWritesUpserted: number;
  monthsTouched: number;
};

export type VerifyRandomSkuSlicesVsMonthsResult = {
  sampleSize: number;
  compared: number;
  mismatches: Array<{
    konkName: string;
    date: string;
    productId: string;
    legacy?: { stock: number; price: number };
    month?: { stock: number; price: number };
    reason: string;
  }>;
  ok: boolean;
};

type SliceLean = {
  konkName: string;
  date: Date;
  data?: Record<string, { stock?: unknown; price?: unknown } | unknown>;
};

type DayWrite = {
  konkName: string;
  productId: string;
  month: Date;
  dayKey: string;
  stock: number;
  price: number;
};

function toYmd(d: Date): string {
  return toSliceDate(d).toISOString().slice(0, 10);
}

function monthTouchKey(w: DayWrite): string {
  return `${w.konkName}|${w.productId}|${toYmd(w.month).slice(0, 7)}`;
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
  const konkName = slice.konkName;
  const out: DayWrite[] = [];

  for (const [rawKey, rawItem] of Object.entries(data)) {
    const productId = rawKey.trim();
    if (!productId) continue;
    if (rawItem === null || rawItem === undefined || typeof rawItem !== "object") {
      continue;
    }
    const item = rawItem as { stock?: unknown; price?: unknown };
    const stock = readMetric(item.stock);
    const price = readMetric(item.price);
    if (stock === null || price === null) continue;
    out.push({ konkName, productId, month, dayKey, stock, price });
  }

  return out;
}

function buildUpsertOps(
  writes: DayWrite[],
): AnyBulkWriteOperation<ISkuSliceMonth>[] {
  return writes.map((w) => ({
    updateOne: {
      filter: {
        konkName: w.konkName,
        productId: w.productId,
        month: w.month,
      },
      update: {
        $set: {
          [`days.${w.dayKey}`]: { stock: w.stock, price: w.price },
        },
        $setOnInsert: {
          konkName: w.konkName,
          productId: w.productId,
          month: w.month,
        },
      },
      upsert: true,
    },
  }));
}

/**
 * Полный перенос всех legacy SkuSlice → SkuSliceMonth (overwrite дней).
 * Обход без глобального sort: cursor по _id.
 */
export async function migrateAllSkuSlicesToMonthsUtil(
  input: MigrateAllSkuSlicesToMonthsInput = {},
): Promise<MigrateAllSkuSlicesToMonthsResult> {
  const apply = input.apply === true;
  const filter: Record<string, unknown> = {};
  const konkName = input.konkName?.trim();
  if (konkName) filter.konkName = konkName;

  const slicesTotal = await SkuSlice.countDocuments(filter);
  const monthsTouchedSet = new Set<string>();
  let dayWritesWouldWrite = 0;
  let dayWritesUpserted = 0;
  let sliceIndex = 0;

  const cursor = SkuSlice.find(filter)
    .select("konkName date data")
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
      await SkuSliceMonth.bulkWrite(buildUpsertOps(writes), { ordered: false });
      dayWritesUpserted += writes.length;
    }

    input.onProgress?.({
      sliceIndex,
      slicesTotal,
      konkName: slice.konkName,
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
export async function verifyRandomSkuSlicesVsMonths(
  sampleSize = 100,
  konkName?: string,
): Promise<VerifyRandomSkuSlicesVsMonthsResult> {
  const filter: Record<string, unknown> = {};
  const kn = konkName?.trim();
  if (kn) filter.konkName = kn;

  const total = await SkuSlice.countDocuments(filter);
  const n = Math.min(sampleSize, total);
  const mismatches: VerifyRandomSkuSlicesVsMonthsResult["mismatches"] = [];

  if (n === 0) {
    return { sampleSize: n, compared: 0, mismatches, ok: true };
  }

  const sampled = (await SkuSlice.aggregate([
    { $match: filter },
    { $sample: { size: n } },
    { $project: { konkName: 1, date: 1, data: 1 } },
  ])) as SliceLean[];

  let compared = 0;

  for (const slice of sampled) {
    const writes = dayWritesFromSliceData(slice);
    const dayKey = toSliceMonthDayKey(toSliceDate(slice.date));
    const month = toSliceMonthDate(toSliceDate(slice.date));

    for (const w of writes) {
      compared += 1;
      const doc = await SkuSliceMonth.findOne({
        konkName: w.konkName,
        productId: w.productId,
        month,
      })
        .select({ [`days.${dayKey}`]: 1 })
        .lean();

      const monthItem = doc?.days?.[dayKey] as
        | { stock?: number; price?: number }
        | undefined;

      if (!monthItem) {
        mismatches.push({
          konkName: w.konkName,
          date: dayKey,
          productId: w.productId,
          legacy: { stock: w.stock, price: w.price },
          reason: "missing_in_months",
        });
        continue;
      }

      if (monthItem.stock !== w.stock || monthItem.price !== w.price) {
        mismatches.push({
          konkName: w.konkName,
          date: dayKey,
          productId: w.productId,
          legacy: { stock: w.stock, price: w.price },
          month: {
            stock: monthItem.stock as number,
            price: monthItem.price as number,
          },
          reason: "value_mismatch",
        });
      }
    }

    // keys in months for this day that shouldn't matter — we only verify legacy→months direction
  }

  return {
    sampleSize: n,
    compared,
    mismatches,
    ok: mismatches.length === 0,
  };
}
