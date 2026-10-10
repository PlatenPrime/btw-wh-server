import type { PipelineStage } from "mongoose";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import type { IBtradeSliceDataItem } from "../models/btradeSliceTypes.js";
import {
  loadDayMaps,
  loadPointsForArtikulsRange,
} from "./btradeSliceMonthStore.js";

export type BtradeSliceAggregateRow = {
  date: Date;
  data?: Record<string, IBtradeSliceDataItem>;
};

/**
 * Маркер списка artikul для shim `aggregateBtradeSlices` (Mongo pipeline не исполняется).
 * Форма сохранена совместимой со старым `$project` filter.
 */
export function sliceDataProjectForArtikulList(
  allowedArtikuls: string[],
): PipelineStage {
  return {
    $project: {
      _id: 0,
      date: 1,
      data: {
        $arrayToObject: {
          $filter: {
            input: { $objectToArray: { $ifNull: ["$data", {}] } },
            as: "p",
            cond: { $in: ["$$p.k", allowedArtikuls] },
          },
        },
      },
    },
  };
}

function extractDateRange(match: Record<string, unknown>): {
  dateFrom: Date;
  dateTo: Date;
} | null {
  const dateFilter = match.date as
    | Date
    | { $gte?: Date; $lte?: Date; $in?: Date[] }
    | undefined;

  if (dateFilter instanceof Date) {
    const d = toSliceDate(dateFilter);
    return { dateFrom: d, dateTo: d };
  }
  if (!dateFilter || typeof dateFilter !== "object") return null;

  if (dateFilter.$in?.length) {
    const times = dateFilter.$in.map((d) => toSliceDate(d).getTime()).sort();
    return {
      dateFrom: new Date(times[0]!),
      dateTo: new Date(times[times.length - 1]!),
    };
  }

  const dateFrom = dateFilter.$gte ? toSliceDate(dateFilter.$gte) : undefined;
  const dateTo = dateFilter.$lte ? toSliceDate(dateFilter.$lte) : undefined;
  if (!dateFrom || !dateTo) return null;
  return { dateFrom, dateTo };
}

/**
 * Пытается вытащить список artikul из legacy `$project` filter `$in`.
 * Для новых вызовов предпочтительнее loadBtradeSliceRowsForArtikuls.
 */
function extractArtikulListFromPipeline(
  pipeline: Array<Record<string, unknown>>,
): string[] | null {
  for (const stage of pipeline) {
    const project = stage.$project as Record<string, unknown> | undefined;
    if (!project || typeof project !== "object") continue;
    const data = project.data as Record<string, unknown> | undefined;
    if (!data || typeof data !== "object") continue;
    const arrayToObject = data.$arrayToObject as
      | Record<string, unknown>
      | undefined;
    const filter = arrayToObject?.$filter as Record<string, unknown> | undefined;
    const cond = filter?.cond as Record<string, unknown> | undefined;
    const inExpr = cond?.$in as unknown[] | undefined;
    if (!Array.isArray(inExpr) || inExpr.length < 2) continue;
    const list = inExpr[1];
    if (Array.isArray(list) && list.every((x) => typeof x === "string")) {
      return list as string[];
    }
  }
  return null;
}

/**
 * Дневные документы `{ date, data }` для списка artikul (форма для reporting).
 */
export async function loadBtradeSliceRowsForArtikuls(
  artikuls: string[],
  dateFrom: Date,
  dateTo: Date,
): Promise<BtradeSliceAggregateRow[]> {
  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  const keys = [...new Set(artikuls.map((a) => a.trim()).filter(Boolean))];
  if (keys.length === 0) return [];

  const points = await loadPointsForArtikulsRange(keys, from, to);
  const byTime = new Map<number, Record<string, IBtradeSliceDataItem>>();
  for (const p of points) {
    const t = toSliceDate(p.date).getTime();
    const rec = byTime.get(t) ?? {};
    rec[p.artikul] = p.item;
    byTime.set(t, rec);
  }

  const rows: BtradeSliceAggregateRow[] = [];
  for (const day of enumerateReportingDates(from, to)) {
    const data = byTime.get(day.getTime());
    if (!data || Object.keys(data).length === 0) continue;
    rows.push({ date: day, data });
  }
  return rows;
}

/**
 * Полные дневные карты за диапазон (все artikul в months).
 */
export async function loadBtradeSliceDayDocs(
  dateFrom: Date,
  dateTo: Date,
): Promise<BtradeSliceAggregateRow[]> {
  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  const dates = enumerateReportingDates(from, to);
  const maps = await loadDayMaps(dates);
  const rows: BtradeSliceAggregateRow[] = [];
  for (const day of dates) {
    const data = maps.get(day.getTime());
    if (!data || Object.keys(data).length === 0) continue;
    rows.push({ date: day, data });
  }
  return rows;
}

/**
 * Thin shim: читает из months вместо BtradeSlice.aggregate.
 * Парсит `$match.date` и опциональный list artikul из legacy project stage.
 */
export async function aggregateBtradeSlices<
  T extends Record<string, unknown> = BtradeSliceAggregateRow,
>(pipeline: PipelineStage[]): Promise<T[]> {
  const stages = pipeline as unknown as Array<Record<string, unknown>>;
  const match = stages.find((s) => s.$match)?.$match as
    | Record<string, unknown>
    | undefined;
  if (!match) return [];

  const range = extractDateRange(match);
  if (!range) return [];

  const artikuls = extractArtikulListFromPipeline(stages);
  const rows = artikuls
    ? await loadBtradeSliceRowsForArtikuls(
        artikuls,
        range.dateFrom,
        range.dateTo,
      )
    : await loadBtradeSliceDayDocs(range.dateFrom, range.dateTo);

  return rows as unknown as T[];
}
