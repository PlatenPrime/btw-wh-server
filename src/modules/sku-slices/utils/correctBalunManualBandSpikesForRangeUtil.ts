import { createLogger } from "../../../logging/createLogger.js";
import {
  BALUN_FAKE_STOCK_KONK_NAME,
  BALUN_MANUAL_BAND_MAX,
  BALUN_MANUAL_BAND_MIN,
} from "../../slices/config/balunFakeStockSentinel.js";
import {
  materializeSkuSliceSalesDateRange,
  sliceDatePlusDays,
} from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  computeRtlBalunBandSpikePatches,
  type RtlBalunBandSpikeSkipReason,
  type RtlBandStockDay,
} from "./computeRtlBalunBandSpikePatches.js";
import { addUtcDays, toUtcYmd } from "./reviewPackFlipsUtil.js";
import { loadDayMapsForKonkDates, upsertDayStockOnly } from "./skuSliceMonthStore.js";
import type { ISkuSliceDataItem } from "../models/skuSliceTypes.js";

const log = createLogger({ module: "sku-slices", job: "balun-manual-band" });

export type CorrectBalunManualBandSpikesForRangeInput = {
  dateFrom: Date;
  dateTo: Date;
  apply?: boolean;
  /** Если задан — только эти productId; иначе все из day-maps за окно±1. */
  productIds?: string[];
};

export type BalunManualBandPatchFinding = {
  productId: string;
  date: string;
  from: number;
  to: number;
};

export type BalunManualBandSkipFinding = {
  productId: string;
  dateFrom: string;
  dateTo: string;
  reason: RtlBalunBandSpikeSkipReason;
};

export type CorrectBalunManualBandSpikesForRangeResult = {
  konkName: string;
  apply: boolean;
  window: { dateFrom: string; dateTo: string };
  band: { min: number; max: number };
  patched: BalunManualBandPatchFinding[];
  skipped: BalunManualBandSkipFinding[];
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
 * RTL sandwich-corrector balun band [BALUN_MANUAL_BAND_MIN, BALUN_MANUAL_BAND_MAX]
 * за [dateFrom, dateTo]. Грузит соседей ±1 одним bulk-load. Не для nightly cron без явного вызова.
 */
export async function correctBalunManualBandSpikesForRangeUtil(
  input: CorrectBalunManualBandSpikesForRangeInput,
): Promise<CorrectBalunManualBandSpikesForRangeResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const apply = input.apply === true;

  const loadFrom = addUtcDays(dateFrom, -1);
  const loadTo = addUtcDays(dateTo, 1);
  const loadDates = enumerateReportingDates(loadFrom, loadTo).map((d) => toSliceDate(d));

  const maps = await loadDayMapsForKonkDates(BALUN_FAKE_STOCK_KONK_NAME, loadDates);
  const dataByDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const date of loadDates) {
    dataByDate.set(date.getTime(), maps.get(date.getTime()) ?? {});
  }

  const filterIds = input.productIds?.map((id) => id.trim()).filter(Boolean);
  const productIds = filterIds && filterIds.length > 0 ? filterIds : collectProductIds(dataByDate);

  const patched: BalunManualBandPatchFinding[] = [];
  const skipped: BalunManualBandSkipFinding[] = [];
  const patchesToWrite: Array<{ productId: string; dateMs: number; to: number }> = [];

  for (const productId of productIds) {
    const series = buildSeriesForProduct(productId, loadDates, dataByDate);
    const { patches, skipped: productSkipped } = computeRtlBalunBandSpikePatches(
      series,
      dateFrom.getTime(),
      dateTo.getTime(),
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
      await upsertDayStockOnly(
        BALUN_FAKE_STOCK_KONK_NAME,
        patch.productId,
        new Date(patch.dateMs),
        patch.to,
      );
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
        konkName: BALUN_FAKE_STOCK_KONK_NAME,
        fromDate: new Date(minMs),
        toDate: sliceDatePlusDays(new Date(maxMs), 1),
        productIds: [productId],
        apply: true,
      });
    }
  }

  const result: CorrectBalunManualBandSpikesForRangeResult = {
    konkName: BALUN_FAKE_STOCK_KONK_NAME,
    apply,
    window: { dateFrom: toUtcYmd(dateFrom), dateTo: toUtcYmd(dateTo) },
    band: { min: BALUN_MANUAL_BAND_MIN, max: BALUN_MANUAL_BAND_MAX },
    patched,
    skipped,
  };

  if (patched.length > 0 || skipped.length > 0) {
    log.info(
      {
        patched: patched.length,
        skipped: skipped.length,
        apply,
        dateFrom: result.window.dateFrom,
        dateTo: result.window.dateTo,
      },
      "balun manual band spike correction",
    );
  }

  return result;
}
