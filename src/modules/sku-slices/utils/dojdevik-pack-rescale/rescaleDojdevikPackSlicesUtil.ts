import type { Types } from "mongoose";
import { getBrowserAxios } from "../../../browser/utils/browserRequest.js";
import { extractDojdevikPackCount } from "../../../browser/dojdevik/utils/extract-dojdevik-pack-count/extractDojdevikPackCount.js";
import { legacyExtractDojdevikPackCount } from "../../../browser/dojdevik/utils/legacy-extract-dojdevik-pack-count/legacyExtractDojdevikPackCount.js";
import { BROWSER_TEXT_CONFIG } from "../../../browser/promua/cart/postPromUaGraphql.js";
import { resolveSkuSliceRequestJitterMs } from "../../../sku-reporting/constants/skuSliceRequestJitterMs.js";
import { Sku } from "../../../skus/models/Sku.js";
import { jitterMs } from "../../../../utils/jitterMs.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import type { ISkuSliceDataItem } from "../../models/skuSliceTypes.js";
import { rescaleDojdevikMonthDays } from "./rescaleDojdevikMonthDays.js";
import {
  DOJDEVIK_PACK_RESCALE_PROGRESS_EVERY,
  shouldReportRescaleProgress,
} from "./shouldReportRescaleProgress.js";

type LeanSkuSliceMonth = {
  _id: Types.ObjectId;
  days?: Record<string, ISkuSliceDataItem>;
};

export const DOJDEVIK_PACK_RESCALE_KONK = "dojdevik";

export type RescaleDojdevikSkuResult = {
  productId: string;
  url: string;
  packOld: number;
  packNew: number;
  status: "skipped-same-pack" | "would-rescale" | "rescaled" | "fetch-error" | "no-months";
  daysChanged: number;
  minDay?: string;
  maxDay?: string;
  error?: string;
};

export type RescaleDojdevikPackProgress = {
  index: number;
  total: number;
  item: RescaleDojdevikSkuResult;
  mismatched: number;
  rescaled: number;
  fetchErrors: number;
};

export type RescaleDojdevikPackSlicesInput = {
  apply: boolean;
  limit?: number;
  productId?: string;
  /** Override jitter range; default = resolveSkuSliceRequestJitterMs(dojdevik). */
  jitterMinMs?: number;
  jitterMaxMs?: number;
  /** Progress cadence; default 10. */
  progressEvery?: number;
  onProgress?: (progress: RescaleDojdevikPackProgress) => void;
  fetchHtml?: (url: string) => Promise<string>;
  sleep?: (ms: number) => Promise<void>;
  /** Injected for tests; default `jitterMs`. */
  resolveJitterMs?: (minMs: number, maxMs: number) => number;
};

export type RescaleDojdevikPackSlicesResult = {
  apply: boolean;
  konkName: string;
  scanned: number;
  mismatched: number;
  rescaled: number;
  fetchErrors: number;
  jitterMinMs: number;
  jitterMaxMs: number;
  minDay?: string;
  maxDay?: string;
  items: RescaleDojdevikSkuResult[];
};

async function defaultFetchHtml(url: string): Promise<string> {
  const client = getBrowserAxios();
  const response = await client.get<string>(url, BROWSER_TEXT_CONFIG);
  return String(response.data ?? "");
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trackDayBounds(
  currentMin: string | undefined,
  currentMax: string | undefined,
  dayKeys: string[],
): { minDay?: string; maxDay?: string } {
  let minDay = currentMin;
  let maxDay = currentMax;
  for (const key of dayKeys) {
    if (!minDay || key < minDay) minDay = key;
    if (!maxDay || key > maxDay) maxDay = key;
  }
  return { ...(minDay ? { minDay } : {}), ...(maxDay ? { maxDay } : {}) };
}

function resolveJitterRange(input: RescaleDojdevikPackSlicesInput): {
  minMs: number;
  maxMs: number;
} {
  const defaults = resolveSkuSliceRequestJitterMs(DOJDEVIK_PACK_RESCALE_KONK);
  const minMs = input.jitterMinMs ?? defaults.minMs;
  const maxMs = input.jitterMaxMs ?? defaults.maxMs;
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || minMs < 0 || maxMs < 0) {
    throw new Error("jitter range must be non-negative finite numbers");
  }
  if (minMs > maxMs) {
    throw new Error("jitterMinMs must be <= jitterMaxMs");
  }
  return { minMs, maxMs };
}

/**
 * One-shot: для dojdevik SKU сравнить legacy vs current packSize по live HTML
 * и переписать историю SkuSliceMonth в новый масштаб.
 * Между GET — random jitter (как у sku-slice scrape).
 */
export async function rescaleDojdevikPackSlicesUtil(
  input: RescaleDojdevikPackSlicesInput,
): Promise<RescaleDojdevikPackSlicesResult> {
  const fetchHtml = input.fetchHtml ?? defaultFetchHtml;
  const sleep = input.sleep ?? defaultSleep;
  const resolvePause = input.resolveJitterMs ?? jitterMs;
  const { minMs: jitterMinMs, maxMs: jitterMaxMs } = resolveJitterRange(input);
  const progressEvery = input.progressEvery ?? DOJDEVIK_PACK_RESCALE_PROGRESS_EVERY;

  const filter: Record<string, unknown> = {
    konkName: DOJDEVIK_PACK_RESCALE_KONK,
    url: { $exists: true, $nin: ["", null] },
  };
  if (input.productId) {
    filter.productId = input.productId;
  }

  let query = Sku.find(filter).select("productId url").lean<{ productId: string; url: string }[]>();
  if (input.limit !== undefined && input.limit > 0) {
    query = query.limit(input.limit);
  }
  const skus = await query;
  const total = skus.length;

  const items: RescaleDojdevikSkuResult[] = [];
  let mismatched = 0;
  let rescaled = 0;
  let fetchErrors = 0;
  let minDay: string | undefined;
  let maxDay: string | undefined;

  const reportProgress = (index: number, item: RescaleDojdevikSkuResult) => {
    if (!input.onProgress) return;
    if (!shouldReportRescaleProgress(index, total, progressEvery)) return;
    input.onProgress({
      index,
      total,
      item,
      mismatched,
      rescaled: input.apply ? rescaled : 0,
      fetchErrors,
    });
  };

  for (let i = 0; i < skus.length; i++) {
    const sku = skus[i]!;
    const index = i + 1;
    if (i > 0 && jitterMaxMs > 0) {
      await sleep(resolvePause(jitterMinMs, jitterMaxMs));
    }

    let item: RescaleDojdevikSkuResult;

    let html: string;
    try {
      html = await fetchHtml(sku.url);
      if (!html.trim()) {
        throw new Error("empty html");
      }
    } catch (err) {
      fetchErrors += 1;
      item = {
        productId: sku.productId,
        url: sku.url,
        packOld: 0,
        packNew: 0,
        status: "fetch-error",
        daysChanged: 0,
        error: err instanceof Error ? err.message : String(err),
      };
      items.push(item);
      reportProgress(index, item);
      continue;
    }

    const packOld = legacyExtractDojdevikPackCount(html);
    const packNew = extractDojdevikPackCount(html);

    if (packOld === packNew) {
      item = {
        productId: sku.productId,
        url: sku.url,
        packOld,
        packNew,
        status: "skipped-same-pack",
        daysChanged: 0,
      };
      items.push(item);
      reportProgress(index, item);
      continue;
    }

    mismatched += 1;

    const months = await SkuSliceMonth.find({
      konkName: DOJDEVIK_PACK_RESCALE_KONK,
      productId: sku.productId,
    }).lean<LeanSkuSliceMonth[]>();

    if (months.length === 0) {
      item = {
        productId: sku.productId,
        url: sku.url,
        packOld,
        packNew,
        status: "no-months",
        daysChanged: 0,
      };
      items.push(item);
      reportProgress(index, item);
      continue;
    }

    let daysChanged = 0;
    const allChangedKeys: string[] = [];

    for (const month of months) {
      const { days, changedDayKeys } = rescaleDojdevikMonthDays(month.days, packOld, packNew);
      if (changedDayKeys.length === 0) continue;
      daysChanged += changedDayKeys.length;
      allChangedKeys.push(...changedDayKeys);
      if (input.apply) {
        await SkuSliceMonth.updateOne({ _id: month._id }, { $set: { days } });
      }
    }

    const bounds = trackDayBounds(minDay, maxDay, allChangedKeys);
    minDay = bounds.minDay;
    maxDay = bounds.maxDay;

    if (input.apply && daysChanged > 0) {
      rescaled += 1;
    }

    item = {
      productId: sku.productId,
      url: sku.url,
      packOld,
      packNew,
      status: input.apply ? "rescaled" : "would-rescale",
      daysChanged,
      ...(bounds.minDay ? { minDay: bounds.minDay } : {}),
      ...(bounds.maxDay ? { maxDay: bounds.maxDay } : {}),
    };
    items.push(item);
    reportProgress(index, item);
  }

  return {
    apply: input.apply,
    konkName: DOJDEVIK_PACK_RESCALE_KONK,
    scanned: skus.length,
    mismatched,
    rescaled: input.apply ? rescaled : 0,
    fetchErrors,
    jitterMinMs,
    jitterMaxMs,
    ...(minDay ? { minDay } : {}),
    ...(maxDay ? { maxDay } : {}),
    items,
  };
}
