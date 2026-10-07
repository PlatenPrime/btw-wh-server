import type { AnyBulkWriteOperation } from "mongoose";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { SkuSlice } from "../models/SkuSlice.js";
import {
  SkuSliceMonth,
  type ISkuSliceMonth,
} from "../models/SkuSliceMonth.js";
import {
  toSliceMonthDate,
  toSliceMonthDayKey,
} from "./skuSliceMonthKeys.js";

export type MaterializeSkuSliceMonthsProgress = {
  sliceIndex: number;
  slicesTotal: number;
  konkName: string;
  date: string;
  daysWrittenInSlice: number;
  dayWritesCumulative: number;
  apply: boolean;
};

export type MaterializeSkuSliceMonthsInput = {
  daysBack: number;
  asOf?: Date;
  konkName?: string;
  apply?: boolean;
  onProgress?: (info: MaterializeSkuSliceMonthsProgress) => void;
};

export type MaterializeSkuSliceMonthsResult = {
  apply: boolean;
  dateFrom: string;
  dateTo: string;
  slicesRead: number;
  daysTouched: string[];
  dayWritesWouldWrite: number;
  dayWritesUpserted: number;
  /** Уникальные ключи konk|productId|YYYY-MM затронутых month-доков. */
  monthsTouched: number;
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
 * Читает SkuSlice Mixed за окно daysBack и upsert'ит дни в SkuSliceMonth.
 * SkuSlice не мутирует. Без deleteMany — дни вне окна в month-доке не чистятся.
 *
 * Обход по дням без `.sort()` на всём окне (лимит Atlas in-memory sort).
 */
export async function materializeSkuSliceMonthsUtil(
  input: MaterializeSkuSliceMonthsInput,
): Promise<MaterializeSkuSliceMonthsResult> {
  if (!Number.isInteger(input.daysBack) || input.daysBack < 1) {
    throw new Error("daysBack must be an integer >= 1");
  }

  const apply = input.apply === true;
  const asOf = toSliceDate(input.asOf ?? new Date());
  const dateFrom = sliceDateMinusDays(asOf, input.daysBack - 1);
  const dateTo = asOf;

  const baseFilter: Record<string, unknown> = {
    date: { $gte: dateFrom, $lte: dateTo },
  };
  const konkName = input.konkName?.trim();
  if (konkName) {
    baseFilter.konkName = konkName;
  }

  const slicesTotal = await SkuSlice.countDocuments(baseFilter);
  const dates = enumerateReportingDates(dateFrom, dateTo);

  const daysTouchedSet = new Set<string>();
  const monthsTouchedSet = new Set<string>();
  let dayWritesWouldWrite = 0;
  let dayWritesUpserted = 0;
  let sliceIndex = 0;

  for (const day of dates) {
    const dayFilter: Record<string, unknown> = { date: day };
    if (konkName) {
      dayFilter.konkName = konkName;
    }

    const slices = (await SkuSlice.find(dayFilter)
      .select("konkName date data")
      .lean()
      .exec()) as SliceLean[];

    if (slices.length === 0) continue;

    slices.sort((a, b) => a.konkName.localeCompare(b.konkName));

    for (const slice of slices) {
      sliceIndex += 1;
      const writes = dayWritesFromSliceData(slice);
      dayWritesWouldWrite += writes.length;
      daysTouchedSet.add(toYmd(slice.date));
      for (const w of writes) {
        monthsTouchedSet.add(monthTouchKey(w));
      }

      if (apply && writes.length > 0) {
        await SkuSliceMonth.bulkWrite(buildUpsertOps(writes), {
          ordered: false,
        });
        dayWritesUpserted += writes.length;
      }

      input.onProgress?.({
        sliceIndex,
        slicesTotal,
        konkName: slice.konkName,
        date: toYmd(slice.date),
        daysWrittenInSlice: writes.length,
        dayWritesCumulative: apply ? dayWritesUpserted : dayWritesWouldWrite,
        apply,
      });
    }
  }

  return {
    apply,
    dateFrom: toYmd(dateFrom),
    dateTo: toYmd(dateTo),
    slicesRead: sliceIndex,
    daysTouched: [...daysTouchedSet].sort(),
    dayWritesWouldWrite,
    dayWritesUpserted: apply ? dayWritesUpserted : 0,
    monthsTouched: monthsTouchedSet.size,
  };
}
