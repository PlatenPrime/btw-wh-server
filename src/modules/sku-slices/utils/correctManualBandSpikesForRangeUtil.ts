import { createLogger } from "../../../logging/createLogger.js";
import {
  materializeSkuSliceSalesDateRange,
  sliceDatePlusDays,
} from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  computeRtlBandSpikePatches,
  type RtlBandSpikeSkipReason,
  type RtlBandStockDay,
} from "./computeRtlBandSpikePatches.js";
import { addUtcDays, toUtcYmd } from "./reviewPackFlipsUtil.js";
import { loadDayMapsForKonkDates, upsertDayStockOnly } from "./skuSliceMonthStore.js";
import type { ISkuSliceDataItem } from "../models/skuSliceTypes.js";

const log = createLogger({ module: "sku-slices", job: "manual-band-spike" });

export type CorrectManualBandSpikesForRangeInput = {
  konkName: string;
  stockMin: number;
  stockMax: number;
  dateFrom: Date;
  dateTo: Date;
  apply?: boolean;
  /** Если задан — только эти productId; иначе все из day-maps за окно±1. */
  productIds?: string[];
};

export type ManualBandPatchFinding = {
  productId: string;
  date: string;
  from: number;
  to: number;
};

export type ManualBandSkipFinding = {
  productId: string;
  dateFrom: string;
  dateTo: string;
  reason: RtlBandSpikeSkipReason;
};

export type CorrectManualBandSpikesForRangeResult = {
  konkName: string;
  apply: boolean;
  window: { dateFrom: string; dateTo: string };
  band: { min: number; max: number };
  patched: ManualBandPatchFinding[];
  skipped: ManualBandSkipFinding[];
};

function readStock(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return undefined;
  }
  const stock = (raw as { stock?: unknown }).stock;
  return typeof stock === "number" && Number.isFinite(stock) ? stock : undefined;
}

function collectProductIds(dataByDate: Map<number, Record<string, ISkuSliceDataItem>>): string[] {
  const ids = new Set<string>();
  for (const data of dataByDate.values()) {
    for (const key of Object.keys(data)) {
      const pid = key.trim();
      if (pid.length > 0) ids.add(pid);
    }
  }
  return [...ids];
}

function buildSeriesForProduct(
  productId: string,
  loadDates: Date[],
  dataByDate: Map<number, Record<string, ISkuSliceDataItem>>,
): RtlBandStockDay[] {
  return loadDates.map((date) => ({
    dateMs: date.getTime(),
    stock: readStock(dataByDate.get(date.getTime())?.[productId]),
  }));
}

/**
 * RTL sandwich-corrector [stockMin, stockMax] за [dateFrom, dateTo] для любого konk.
 * Грузит соседей ±1 одним bulk-load. Не для nightly cron.
 */
export async function correctManualBandSpikesForRangeUtil(
  input: CorrectManualBandSpikesForRangeInput,
): Promise<CorrectManualBandSpikesForRangeResult> {
  const konkName = input.konkName.trim().toLowerCase();
  const stockMin = input.stockMin;
  const stockMax = input.stockMax;
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const apply = input.apply === true;

  const loadFrom = addUtcDays(dateFrom, -1);
  const loadTo = addUtcDays(dateTo, 1);
  const loadDates = enumerateReportingDates(loadFrom, loadTo).map((d) => toSliceDate(d));

  const maps = await loadDayMapsForKonkDates(konkName, loadDates);
  const dataByDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const date of loadDates) {
    dataByDate.set(date.getTime(), maps.get(date.getTime()) ?? {});
  }

  const filterIds = input.productIds?.map((id) => id.trim()).filter(Boolean);
  const productIds = filterIds && filterIds.length > 0 ? filterIds : collectProductIds(dataByDate);

  const patched: ManualBandPatchFinding[] = [];
  const skipped: ManualBandSkipFinding[] = [];
  const patchesToWrite: Array<{ productId: string; dateMs: number; to: number }> = [];

  for (const productId of productIds) {
    const series = buildSeriesForProduct(productId, loadDates, dataByDate);
    const { patches, skipped: productSkipped } = computeRtlBandSpikePatches(
      series,
      dateFrom.getTime(),
      dateTo.getTime(),
      { bandMin: stockMin, bandMax: stockMax },
    );

    for (const p of patches) {
      patched.push({
        productId,
        date: toUtcYmd(new Date(p.dateMs)),
        from: p.from,
        to: p.to,
      });
      patchesToWrite.push({ productId, dateMs: p.dateMs, to: p.to });
    }
    for (const s of productSkipped) {
      skipped.push({
        productId,
        dateFrom: toUtcYmd(new Date(s.dateFromMs)),
        dateTo: toUtcYmd(new Date(s.dateToMs)),
        reason: s.reason,
      });
    }
  }

  if (apply && patchesToWrite.length > 0) {
    for (const patch of patchesToWrite) {
      await upsertDayStockOnly(konkName, patch.productId, new Date(patch.dateMs), patch.to);
    }

    const byProduct = new Map<string, number[]>();
    for (const patch of patchesToWrite) {
      const list = byProduct.get(patch.productId) ?? [];
      list.push(patch.dateMs);
      byProduct.set(patch.productId, list);
    }

    for (const [productId, dateMsList] of byProduct) {
      const minMs = Math.min(...dateMsList);
      const maxMs = Math.max(...dateMsList);
      await materializeSkuSliceSalesDateRange({
        konkName,
        fromDate: new Date(minMs),
        toDate: sliceDatePlusDays(new Date(maxMs), 1),
        productIds: [productId],
        apply: true,
      });
    }
  }

  const result: CorrectManualBandSpikesForRangeResult = {
    konkName,
    apply,
    window: { dateFrom: toUtcYmd(dateFrom), dateTo: toUtcYmd(dateTo) },
    band: { min: stockMin, max: stockMax },
    patched,
    skipped,
  };

  if (patched.length > 0 || skipped.length > 0) {
    log.info(
      {
        konkName,
        patched: patched.length,
        skipped: skipped.length,
        apply,
        dateFrom: result.window.dateFrom,
        dateTo: result.window.dateTo,
        stockMin,
        stockMax,
      },
      "manual band spike correction",
    );
  }

  return result;
}
