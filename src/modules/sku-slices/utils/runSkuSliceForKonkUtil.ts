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

  AIR_SKU_SLICE_CHUNK_MAX_FETCHES,

  AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS,

  AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS,

  AIR_SKU_SLICE_CLUSTER_SIZE,

  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS,

  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS,

  isAirSkuSliceChunkKonk,

  resolveSkuSliceRequestJitterMs,

  shouldEndAirSkuSliceChunk,

} from "../../sku-reporting/constants/skuSliceRequestJitterMs.js";

import { isOriginBlockedError } from "../../browser/utils/browserOriginBlockedError.js";

import { resetImpitClientCache } from "../../browser/utils/impitGet.js";

import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";

import { loadSlicedSkusForKonk } from "./loadSlicedSkusForKonk.js";

import { isSkuSliceDataKeyFilled } from "./isSkuSliceDataKeyFilled.js";



type SliceCounters = {

  count: number;

  invalid: number;

  errors: number;

};



type SlicedSkuRow = {

  _id: { toString(): string };

  productId?: string;

};



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



async function delayBetweenSkuFetches(args: {

  konkName: string;

  listIndex: number;

  listTotal: number;

  fetchesInChunk?: number;

}): Promise<void> {

  const { konkName, listIndex, listTotal } = args;

  if (listIndex >= listTotal - 1) {

    return;

  }



  const { minMs, maxMs } = resolveSkuSliceRequestJitterMs(konkName);

  await delay(jitterMs(minMs, maxMs));



  const isAir = normalizeCompetitorName(konkName) === "air";

  if (!isAir) {

    return;

  }



  const completedForCluster =

    args.fetchesInChunk ?? listIndex + 1;

  if (

    completedForCluster % AIR_SKU_SLICE_CLUSTER_SIZE === 0 &&

    completedForCluster < listTotal

  ) {

    await delay(

      jitterMs(

        AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS,

        AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS

      )

    );

  }

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

}): Promise<"ok" | "origin_blocked" | "unsupported"> {

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

    } else {

      counters.count += 1;

    }

    return "ok";

  } catch (err) {

    const e = err as Error & { code?: string };

    if (e.code === UNSUPPORTED_KONK_CODE || isOriginBlockedError(err)) {

      log.warn(

        { productKey, err: e.message, remaining: args.listTotal - args.listIndex },

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



async function runAirSkuSliceWithChunks(args: {

  konkName: string;

  sliceDate: Date;

  withPid: SlicedSkuRow[];

  counters: SliceCounters;

}): Promise<void> {

  const { konkName, sliceDate, withPid, counters } = args;

  const log = createLogger({ module: "sku-slices", konkName });



  const sliceDoc = await SkuSlice.findOne({ konkName, date: sliceDate })

    .select("data")

    .lean();

  const sliceData: Record<string, unknown> = {

    ...(sliceDoc?.data ?? {}),

  };



  let index = 0;

  let chunkIndex = 0;



  while (index < withPid.length) {

    let fetchesInChunk = 0;

    let abortReason: "origin_blocked" | "unsupported" | null = null;



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

      });



      if (outcome === "origin_blocked" || outcome === "unsupported") {

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

        });

      }

    }



    if (abortReason !== null) {

      break;

    }



    const pendingAfterChunk = countPendingSkuFetches(withPid, index, sliceData);

    if (index >= withPid.length || pendingAfterChunk === 0) {

      break;

    }



    chunkIndex += 1;

    log.info(

      {

        chunkIndex,

        fetchesInChunk,

        pendingAfterChunk,

        processedIndex: index,

      },

      "air sku slice chunk completed"

    );



    resetImpitClientCache();

    await delay(

      jitterMs(

        AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS,

        AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS

      )

    );

  }

}



async function runStandardSkuSliceLoop(args: {

  konkName: string;

  sliceDate: Date;

  withPid: SlicedSkuRow[];

  counters: SliceCounters;

}): Promise<void> {

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



    if (outcome === "origin_blocked" || outcome === "unsupported") {

      break;

    }



    if (i < withPid.length - 1) {

      await delayBetweenSkuFetches({

        konkName,

        listIndex: i,

        listTotal: withPid.length,

      });

    }

  }

}



/**

 * Собирает срез по всем SKU конкурента: upsert документа, затем по каждому SKU

 * с паузой resolveSkuSliceRequestJitterMs(konk) (дефолт 500–1500 мс, air 2000–5000).

 * Air: чанки до 1200 fetch, inter-chunk 45–60 мин + reset Impit, skip valid keys.

 * ORIGIN_BLOCKED / unsupported konk обрывает цикл; proactive chunk stop не пишет errors.

 */

export type SkuSliceKonkResult = {

  saved: boolean;

  count: number;

  total: number;

  invalid: number;

  errors: number;

};



export async function runSkuSliceForKonkUtil(

  konkName: string,

  date: Date

): Promise<SkuSliceKonkResult> {

  const sliceDate = toSliceDate(date);

  const skus = await loadSlicedSkusForKonk(konkName, "_id productId");



  await SkuSlice.findOneAndUpdate(

    { konkName, date: sliceDate },

    { $setOnInsert: { konkName, date: sliceDate, data: {} } },

    { upsert: true }

  );



  const counters: SliceCounters = { count: 0, invalid: 0, errors: 0 };

  const total = skus.length;

  const withPid = skus.filter((s) => (s.productId ?? "").trim() !== "") as SlicedSkuRow[];

  counters.invalid += total - withPid.length;



  if (isAirSkuSliceChunkKonk(konkName)) {

    await runAirSkuSliceWithChunks({

      konkName,

      sliceDate,

      withPid,

      counters,

    });

  } else {

    await runStandardSkuSliceLoop({

      konkName,

      sliceDate,

      withPid,

      counters,

    });

  }



  return {

    saved: true,

    count: counters.count,

    total,

    invalid: counters.invalid,

    errors: counters.errors,

  };

}


