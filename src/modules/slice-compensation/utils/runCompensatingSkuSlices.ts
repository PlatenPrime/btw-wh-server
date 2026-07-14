import { Sku } from "../../skus/models/Sku.js";
import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../skus/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../../sku-slices/models/SkuSlice.js";
import { getExcludedCompetitorSet } from "../../slices/config/excludedCompetitors.js";
import {
  buildCompensatingDataKeyQueue,
  runCompensatingSliceRefetchLoop,
} from "./compensatingSliceRunner.js";
import { isFullMinusOneSliceStockResult } from "../../slices/utils/isInvalidSliceStockResult.js";
import { shouldRefetchSkuSliceItem } from "./shouldRefetchSkuSliceItem.js";
import {
  logModuleError,
  logModuleInfo,
  logModuleWarn,
} from "../../../logging/logModuleError.js";

type SkuSliceLean = {
  konkName: string;
  data?: Record<string, unknown>;
};

type SkuIdLean = { _id: { toString(): string } };

export type RunCompensatingSkuSlicesOptions = {
  /** Если задан — только документ этого konk (ожидается уже нормализованное имя). */
  konkName?: string;
};

/**
 * Повторный опрос позиций SkuSlice за sliceDate: -1/-1 или цена не конечное неотрицательное число.
 * Если ответ опроса не в режиме полного -1/-1, перезаписывает ключ в том же документе.
 */
export async function runCompensatingSkuSlices(
  sliceDate: Date,
  options?: RunCompensatingSkuSlicesOptions
): Promise<{ refetched: number; updated: number }> {
  const excluded = getExcludedCompetitorSet("skuSlices");
  const filter: { date: Date; konkName?: string } = { date: sliceDate };
  if (options?.konkName) {
    filter.konkName = options.konkName;
  }
  const docs = (await SkuSlice.find(filter)
    .select("konkName data")
    .lean()) as SkuSliceLean[];

  const queue = buildCompensatingDataKeyQueue(
    docs,
    excluded,
    shouldRefetchSkuSliceItem
  );

  return runCompensatingSliceRefetchLoop(queue, async ({ konkName, dataKey }) => {
    const productKey = dataKey;
    try {
      const sku = (await Sku.findOne({ konkName, productId: productKey })
        .select("_id")
        .lean()) as SkuIdLean | null;
      if (!sku) {
        logModuleWarn(
          "slice-compensation",
          "compensating sku: entity not found, skip",
          { konkName, productKey }
        );
        return { refetched: 0, updated: 0 };
      }
      const result = await getSkuStockDataUtil(sku._id.toString());
      if (!result) {
        logModuleInfo("slice-compensation", "compensating sku refetch empty", {
          konkName,
          productKey,
          kind: "sku",
        });
        return { refetched: 0, updated: 0 };
      }
      let updated = 0;
      if (!isFullMinusOneSliceStockResult(result)) {
        const dataItem = { stock: result.stock, price: result.price };
        await SkuSlice.findOneAndUpdate(
          { konkName, date: sliceDate },
          { $set: { [`data.${productKey}`]: dataItem } }
        );
        updated = 1;
      }
      logModuleInfo("slice-compensation", "compensating sku refetch result", {
        konkName,
        productKey,
        kind: "sku",
        stock: result.stock,
        price: result.price,
        updated: updated === 1,
      });
      return { refetched: 1, updated };
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === UNSUPPORTED_KONK_CODE) {
        logModuleWarn("slice-compensation", "unsupported konk, skipping refetch", {
          konkName,
          productKey,
        });
        return { refetched: 0, updated: 0 };
      }
      const msg = err instanceof Error ? err.message : String(err);
      logModuleError("slice-compensation", err, "compensating sku slice refetch failed", {
        konkName,
        productKey,
        message: msg,
      });
      return { refetched: 0, updated: 0 };
    }
  });
}
