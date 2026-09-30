import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../../../skus/utils/getSkuStockDataUtil.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { isInvalidSliceStockResult } from "../../../../slices/utils/isInvalidSliceStockResult.js";
import { isOriginBlockedError } from "../../../../browser/utils/browserOriginBlockedError.js";
import { createLogger } from "../../../../../logging/createLogger.js";
import { delay } from "../../../../../utils/delay.js";
import { jitterMs } from "../../../../../utils/jitterMs.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { resolveSkuSliceRequestJitterMs } from "../../../../sku-reporting/constants/skuSliceRequestJitterMs.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import type { RunSkugrSlicesTodayInput } from "../schemas/runSkugrSlicesTodaySchema.js";

export type RunSkuSliceForSkugrTodayResult = {
  skugrId: string;
  konkName: string;
  sliceDate: Date;
  total: number;
  count: number;
  invalid: number;
  errors: number;
};

export type RunSkuSliceForSkugrTodayOptions = {
  onProgress?: (done: number, total: number, message?: string) => void;
  signal?: AbortSignal;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }
}

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
        await delay(delays[attempt - 1]!);
      }
    }
  }

  throw lastError ?? new Error("Unknown error in fetchSkuStockWithRetry");
}

/**
 * Ручной scrape всех SKU товарной группы за сегодня с полной перезаписью точек.
 * Rotation и skip filled не применяются. Документ дня создаётся при необходимости.
 */
export async function runSkuSliceForSkugrTodayUtil(
  input: RunSkugrSlicesTodayInput,
  options?: RunSkuSliceForSkugrTodayOptions
): Promise<RunSkuSliceForSkugrTodayResult | null> {
  throwIfAborted(options?.signal);
  const skugr = await Skugr.findById(input.skugrId)
    .select("konkName skus")
    .lean();
  if (!skugr) return null;

  const konkName = skugr.konkName;
  const sliceDate = toSliceDate(new Date());
  const skuIds = [
    ...new Set(skugr.skus.map((id) => id.toString())),
  ];

  const skus =
    skuIds.length === 0
      ? []
      : await Sku.find({
          _id: { $in: skuIds },
          konkName,
        })
          .select("_id productId")
          .lean();

  await SkuSlice.findOneAndUpdate(
    { konkName, date: sliceDate },
    { $setOnInsert: { konkName, date: sliceDate, data: {} } },
    { upsert: true }
  );

  const counters = { count: 0, invalid: 0, errors: 0 };
  const total = skus.length;
  const withPid = skus.filter((s) => (s.productId ?? "").trim() !== "");
  counters.invalid += total - withPid.length;

  const log = createLogger({ module: "sku-slices", konkName });
  const progressTotal = Math.max(withPid.length, 1);
  options?.onProgress?.(0, progressTotal, "Starting skugr slice scrape");

  for (let i = 0; i < withPid.length; i++) {
    throwIfAborted(options?.signal);
    const sku = withPid[i]!;
    const productKey = sku.productId!.trim();
    const skuId = sku._id.toString();

    try {
      const result = await fetchSkuStockWithRetry(konkName, productKey, skuId);
      if (result == null) {
        counters.invalid += 1;
        log.warn({ productKey, skugrId: input.skugrId }, "skugr slice item invalid");
      } else {
        const dataItem = { stock: result.stock, price: result.price };
        await SkuSlice.findOneAndUpdate(
          { konkName, date: sliceDate },
          { $set: { [`data.${productKey}`]: dataItem } }
        );

        if (isInvalidSliceStockResult(result)) {
          counters.invalid += 1;
          log.warn(
            {
              productKey,
              skugrId: input.skugrId,
              stock: result.stock,
              price: result.price,
            },
            "skugr slice item invalid"
          );
        } else {
          counters.count += 1;
        }
      }
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === UNSUPPORTED_KONK_CODE || isOriginBlockedError(err)) {
        const remaining = withPid.length - i;
        counters.errors += remaining;
        log.error(
          {
            productKey,
            skugrId: input.skugrId,
            err: e.message,
            remaining,
          },
          isOriginBlockedError(err)
            ? "origin blocked, skugr slice aborted"
            : "unsupported konk for stock fetch, skugr slice aborted"
        );
        break;
      }
      counters.errors += 1;
      const msg = err instanceof Error ? err.message : String(err);
      log.error(
        { productKey, skugrId: input.skugrId, err: msg },
        "skugr slice item failed"
      );
    }

    options?.onProgress?.(
      i + 1,
      progressTotal,
      `SKU ${i + 1}/${withPid.length}`
    );

    if (i < withPid.length - 1) {
      throwIfAborted(options?.signal);
      const { minMs, maxMs } = resolveSkuSliceRequestJitterMs(konkName);
      await delay(jitterMs(minMs, maxMs));
    }
  }

  return {
    skugrId: input.skugrId,
    konkName,
    sliceDate,
    total,
    count: counters.count,
    invalid: counters.invalid,
    errors: counters.errors,
  };
}
