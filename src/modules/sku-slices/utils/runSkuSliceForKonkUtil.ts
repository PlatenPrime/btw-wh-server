import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../skus/utils/getSkuStockDataUtil.js";
import { isInvalidSliceStockResult } from "../../slices/utils/isInvalidSliceStockResult.js";
import { SkuSlice } from "../models/SkuSlice.js";
import { createLogger } from "../../../logging/createLogger.js";
import { delay } from "../../../utils/delay.js";
import { jitterMs } from "../../../utils/jitterMs.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  AIR_SKU_SLICE_BLOCK_PAUSE_MAX_MS,
  AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS,
  AIR_SKU_SLICE_CHUNK_MAX_FETCHES,
  AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS,
  AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS,
  AIR_SKU_SLICE_CONSECUTIVE_INVALID_ABORT,
  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS,
  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS,
  isAirSkuSliceChunkKonk,
  resolveAirSkuSlicePauseKind,
  resolveSkuSliceRequestJitterMs,
  shouldEndAirSkuSliceChunk,
  type AirSkuSlicePauseKind,
  type SkuSliceAbortReason,
} from "../../sku-reporting/constants/skuSliceRequestJitterMs.js";
import { isOriginBlockedError } from "../../browser/utils/browserOriginBlockedError.js";
import { resetImpitClientCache } from "../../browser/utils/impitGet.js";
import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
import { loadSlicedSkusForKonk } from "./loadSlicedSkusForKonk.js";
import { filterSlicedSkusForRotation } from "./filterSlicedSkusForRotation.js";
import { isSkuSliceDataKeyFilled } from "./isSkuSliceDataKeyFilled.js";
import type { ISkuSliceRotationMeta } from "../models/SkuSlice.js";

type SliceCounters = {
  count: number;
  invalid: number;
  errors: number;
};

type SlicedSkuRow = {
  _id: { toString(): string };
  productId?: string;
};

type ProcessOutcome =
  | "ok"
  | "origin_blocked"
  | "unsupported"
  | "consecutive_invalid";

async function fetchSkuStockWithRetry(
  konkName: string,
  productKey: string,
  skuId: string
) {
  const log = createLogger({ module: "sku-slices", konkName });
  const delays = [1000, 3000, 5000];

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= delays.length; attempt++) {
    try {
      return await getSkuStockDataUtil(skuId);
    } catch (err) {
      const e = err as Error & { code?: string };

      if (e.code === UNSUPPORTED_KONK_CODE || isOriginBlockedError(err)) {
        throw e;
      }

      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      log.warn(
        { productKey, attempt, maxAttempts: delays.length, err: msg },
        "sku stock fetch attempt failed"
      );

      if (attempt < delays.length) {
        const waitMs = delays[attempt - 1]!;
        log.warn({ productKey, waitMs }, "sku stock fetch retry scheduled");
        await delay(waitMs);
      }
    }
  }

  throw lastError ?? new Error("Unknown error in fetchSkuStockWithRetry");
}

function pauseRangeForKind(
  kind: Exclude<AirSkuSlicePauseKind, "none">
): { minMs: number; maxMs: number } {
  if (kind === "block") {
    return {
      minMs: AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS,
      maxMs: AIR_SKU_SLICE_BLOCK_PAUSE_MAX_MS,
    };
  }
  return {
    minMs: AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS,
    maxMs: AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS,
  };
}

async function delayBetweenSkuFetches(args: {
  konkName: string;
  listIndex: number;
  listTotal: number;
  fetchesInChunk?: number;
  counters?: SliceCounters;
}): Promise<void> {
  const { konkName, listIndex, listTotal } = args;
  if (listIndex >= listTotal - 1) {
    return;
  }

  const isAir = normalizeCompetitorName(konkName) === "air";
  const fetchesInChunk = args.fetchesInChunk ?? listIndex + 1;

  if (isAir) {
    const pauseKind = resolveAirSkuSlicePauseKind(
      fetchesInChunk,
      listIndex >= listTotal - 1
    );
    // Граница чанка: inter-chunk pause делает runAirSkuSliceWithChunks — без jitter.
    if (
      pauseKind === "none" &&
      fetchesInChunk > 0 &&
      fetchesInChunk % AIR_SKU_SLICE_CHUNK_MAX_FETCHES === 0
    ) {
      return;
    }
  }

  const { minMs, maxMs } = resolveSkuSliceRequestJitterMs(konkName);
  await delay(jitterMs(minMs, maxMs));

  if (!isAir) {
    return;
  }

  const pauseKind = resolveAirSkuSlicePauseKind(
    fetchesInChunk,
    listIndex >= listTotal - 1
  );
  if (pauseKind === "none") {
    return;
  }

  const range = pauseRangeForKind(pauseKind);
  const pauseMs = jitterMs(range.minMs, range.maxMs);
  await delay(pauseMs);

  const log = createLogger({ module: "sku-slices", konkName });
  log.info(
    {
      pauseKind,
      pauseMs,
      fetchesInChunk,
      index: listIndex + 1,
      total: listTotal,
      count: args.counters?.count ?? 0,
      invalid: args.counters?.invalid ?? 0,
      errors: args.counters?.errors ?? 0,
    },
    "air sku slice pause"
  );
}

function countPendingSkuFetches(
  withPid: SlicedSkuRow[],
  startIndex: number,
  sliceData: Record<string, unknown>
): number {
  let pending = 0;
  for (let i = startIndex; i < withPid.length; i++) {
    const productKey = withPid[i]!.productId!.trim();
    if (!isSkuSliceDataKeyFilled(sliceData[productKey])) {
      pending += 1;
    }
  }
  return pending;
}

async function processOneSkuForSlice(args: {
  konkName: string;
  sliceDate: Date;
  sku: SlicedSkuRow;
  productKey: string;
  sliceData: Record<string, unknown>;
  counters: SliceCounters;
  listIndex: number;
  listTotal: number;
  consecutiveInvalid?: { value: number };
}): Promise<ProcessOutcome> {
  const { konkName, sliceDate, sku, productKey, sliceData, counters } = args;
  const skuId = sku._id.toString();
  const log = createLogger({ module: "sku-slices", konkName });

  log.debug(
    { productKey, index: args.listIndex + 1, total: args.listTotal },
    "processing sku for slice"
  );

  try {
    const result = await fetchSkuStockWithRetry(konkName, productKey, skuId);
    if (result == null) {
      counters.invalid += 1;
      log.warn({ productKey }, "sku slice item invalid");
      if (args.consecutiveInvalid) {
        args.consecutiveInvalid.value += 1;
        if (
          args.consecutiveInvalid.value >= AIR_SKU_SLICE_CONSECUTIVE_INVALID_ABORT
        ) {
          const remaining = Math.max(0, args.listTotal - args.listIndex - 1);
          log.error(
            {
              productKey,
              consecutiveInvalid: args.consecutiveInvalid.value,
              remaining,
              count: counters.count,
              invalid: counters.invalid,
              errors: counters.errors,
            },
            "consecutive invalid, sku slice aborted"
          );
          counters.errors += remaining;
          return "consecutive_invalid";
        }
      }
      return "ok";
    }

    const dataItem = { stock: result.stock, price: result.price };
    await SkuSlice.findOneAndUpdate(
      { konkName, date: sliceDate },
      { $set: { [`data.${productKey}`]: dataItem } }
    );
    sliceData[productKey] = dataItem;

    if (isInvalidSliceStockResult(result)) {
      counters.invalid += 1;
      log.warn(
        { productKey, stock: result.stock, price: result.price },
        "sku slice item invalid"
      );
      if (args.consecutiveInvalid) {
        args.consecutiveInvalid.value += 1;
        if (
          args.consecutiveInvalid.value >= AIR_SKU_SLICE_CONSECUTIVE_INVALID_ABORT
        ) {
          const remaining = Math.max(0, args.listTotal - args.listIndex - 1);
          log.error(
            {
              productKey,
              consecutiveInvalid: args.consecutiveInvalid.value,
              remaining,
              count: counters.count,
              invalid: counters.invalid,
              errors: counters.errors,
            },
            "consecutive invalid, sku slice aborted"
          );
          counters.errors += remaining;
          return "consecutive_invalid";
        }
      }
    } else {
      counters.count += 1;
      if (args.consecutiveInvalid) {
        args.consecutiveInvalid.value = 0;
      }
    }
    return "ok";
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === UNSUPPORTED_KONK_CODE || isOriginBlockedError(err)) {
      log.error(
        {
          productKey,
          err: e.message,
          remaining: args.listTotal - args.listIndex,
          count: counters.count,
          invalid: counters.invalid,
          errors: counters.errors,
        },
        isOriginBlockedError(err)
          ? "origin blocked, sku slice aborted"
          : "unsupported konk for stock fetch, slice aborted"
      );
      counters.errors += args.listTotal - args.listIndex;
      return isOriginBlockedError(err) ? "origin_blocked" : "unsupported";
    }
    counters.errors += 1;
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ productKey, err: msg }, "sku slice item failed");
    return "ok";
  }
}

function isAbortOutcome(
  outcome: ProcessOutcome
): outcome is Exclude<ProcessOutcome, "ok"> {
  return outcome !== "ok";
}

async function runAirSkuSliceWithChunks(args: {
  konkName: string;
  sliceDate: Date;
  withPid: SlicedSkuRow[];
  counters: SliceCounters;
}): Promise<SkuSliceAbortReason | null> {
  const { konkName, sliceDate, withPid, counters } = args;
  const log = createLogger({ module: "sku-slices", konkName });

  const sliceDoc = await SkuSlice.findOne({ konkName, date: sliceDate })
    .select("data")
    .lean();
  const sliceData: Record<string, unknown> = {
    ...(sliceDoc?.data ?? {}),
  };

  const pendingAtStart = countPendingSkuFetches(withPid, 0, sliceData);
  log.info(
    {
      total: withPid.length,
      pending: pendingAtStart,
      chunkMaxFetches: AIR_SKU_SLICE_CHUNK_MAX_FETCHES,
    },
    "air sku slice started"
  );

  let index = 0;
  let chunkIndex = 0;
  const consecutiveInvalid = { value: 0 };

  while (index < withPid.length) {
    let fetchesInChunk = 0;
    let abortReason: SkuSliceAbortReason | null = null;

    while (
      index < withPid.length &&
      !shouldEndAirSkuSliceChunk(fetchesInChunk) &&
      abortReason === null
    ) {
      const sku = withPid[index]!;
      const productKey = sku.productId!.trim();

      if (isSkuSliceDataKeyFilled(sliceData[productKey])) {
        index += 1;
        continue;
      }

      const outcome = await processOneSkuForSlice({
        konkName,
        sliceDate,
        sku,
        productKey,
        sliceData,
        counters,
        listIndex: index,
        listTotal: withPid.length,
        consecutiveInvalid,
      });

      if (isAbortOutcome(outcome)) {
        abortReason = outcome;
        break;
      }

      fetchesInChunk += 1;
      index += 1;

      if (index < withPid.length && abortReason === null) {
        await delayBetweenSkuFetches({
          konkName,
          listIndex: index - 1,
          listTotal: withPid.length,
          fetchesInChunk,
          counters,
        });
      }
    }

    if (abortReason !== null) {
      return abortReason;
    }

    const pendingAfterChunk = countPendingSkuFetches(withPid, index, sliceData);
    if (index >= withPid.length || pendingAfterChunk === 0) {
      break;
    }

    chunkIndex += 1;
    const interChunkPauseMs = jitterMs(
      AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS,
      AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS
    );
    log.info(
      {
        chunkIndex,
        fetchesInChunk,
        pendingAfterChunk,
        processedIndex: index,
        pauseKind: "chunk",
        pauseMs: interChunkPauseMs,
        count: counters.count,
        invalid: counters.invalid,
        errors: counters.errors,
      },
      "air sku slice chunk completed"
    );

    resetImpitClientCache();
    await delay(interChunkPauseMs);
  }

  return null;
}

async function runStandardSkuSliceLoop(args: {
  konkName: string;
  sliceDate: Date;
  withPid: SlicedSkuRow[];
  counters: SliceCounters;
}): Promise<SkuSliceAbortReason | null> {
  const { konkName, sliceDate, withPid, counters } = args;

  for (let i = 0; i < withPid.length; i++) {
    const sku = withPid[i]!;
    const productKey = sku.productId!.trim();
    const sliceData: Record<string, unknown> = {};

    const outcome = await processOneSkuForSlice({
      konkName,
      sliceDate,
      sku,
      productKey,
      sliceData,
      counters,
      listIndex: i,
      listTotal: withPid.length,
    });

    if (isAbortOutcome(outcome)) {
      return outcome;
    }

    if (i < withPid.length - 1) {
      await delayBetweenSkuFetches({
        konkName,
        listIndex: i,
        listTotal: withPid.length,
        counters,
      });
    }
  }

  return null;
}

/**
 * Собирает срез по всем SKU конкурента: upsert документа, затем по каждому SKU
 * с паузой resolveSkuSliceRequestJitterMs(konk) (дефолт 500–1500 мс, air 2000–5000).
 * Air: чанки до 1000 fetch, паузы 10/100/1000, inter-chunk 45–60 мин + reset Impit.
 * ORIGIN_BLOCKED / unsupported / consecutive_invalid обрывает цикл; proactive chunk stop не пишет errors.
 */
export type SkuSliceKonkResult = {
  saved: boolean;
  count: number;
  total: number;
  dueTotal?: number;
  rotationMeta?: ISkuSliceRotationMeta;
  invalid: number;
  errors: number;
  abortReason?: SkuSliceAbortReason;
};

export async function runSkuSliceForKonkUtil(
  konkName: string,
  date: Date
): Promise<SkuSliceKonkResult> {
  const log = createLogger({ module: "sku-slices", konkName });
  const sliceDate = toSliceDate(date);
  const skus = await loadSlicedSkusForKonk(konkName, "_id productId");

  await SkuSlice.findOneAndUpdate(
    { konkName, date: sliceDate },
    { $setOnInsert: { konkName, date: sliceDate, data: {} } },
    { upsert: true }
  );

  const counters: SliceCounters = { count: 0, invalid: 0, errors: 0 };
  const total = skus.length;
  const withPidAll = skus.filter(
    (s) => (s.productId ?? "").trim() !== ""
  ) as SlicedSkuRow[];
  counters.invalid += total - withPidAll.length;

  const { skus: withPid, rotation } = filterSlicedSkusForRotation(
    withPidAll,
    sliceDate,
    konkName
  );

  let rotationMeta: ISkuSliceRotationMeta | undefined;
  if (rotation) {
    rotationMeta = {
      cycleDays: rotation.cycleDays,
      dayIndex: rotation.dayIndex,
      dueCount: withPid.length,
    };
    await SkuSlice.findOneAndUpdate(
      { konkName, date: sliceDate },
      { $set: { rotationMeta } }
    );
    log.info(
      {
        rotationDayIndex: rotation.dayIndex,
        cycleDays: rotation.cycleDays,
        dueCount: withPid.length,
        totalSliced: withPidAll.length,
      },
      "sku slice rotation filter applied"
    );
  }

  let abortReason: SkuSliceAbortReason | null = null;

  if (isAirSkuSliceChunkKonk(konkName)) {
    abortReason = await runAirSkuSliceWithChunks({
      konkName,
      sliceDate,
      withPid,
      counters,
    });
  } else {
    abortReason = await runStandardSkuSliceLoop({
      konkName,
      sliceDate,
      withPid,
      counters,
    });
  }

  const result: SkuSliceKonkResult = {
    saved: true,
    count: counters.count,
    total,
    invalid: counters.invalid,
    errors: counters.errors,
  };
  if (rotationMeta) {
    result.dueTotal = rotationMeta.dueCount;
    result.rotationMeta = rotationMeta;
  }
  if (abortReason !== null) {
    result.abortReason = abortReason;
  }
  return result;
}
