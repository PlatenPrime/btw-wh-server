import { Sku } from "../../skus/models/Sku.js";
import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../skus/utils/getSkuStockDataUtil.js";
import { SkuSliceDayMeta } from "../../sku-slices/models/SkuSliceDayMeta.js";
import { SkuSliceMonth } from "../../sku-slices/models/SkuSliceMonth.js";
import {
  loadDayMapForKonk,
  upsertDayPoint,
} from "../../sku-slices/utils/skuSliceMonthStore.js";
import {
  toSliceMonthDate,
  toSliceMonthDayKey,
} from "../../sku-slices/utils/skuSliceMonthKeys.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { getCompensationExcludedCompetitorSet } from "../../slices/config/excludedCompetitors.js";
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
import { afterSkuSliceStockMutation } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";

type SkuIdLean = { _id: { toString(): string } };

export type RunCompensatingSkuSlicesOptions = {
  /** Если задан — только этот konk (ожидается уже нормализованное имя). */
  konkName?: string;
  onProgress?: (done: number, total: number, message?: string) => void;
  signal?: AbortSignal;
};

async function resolveKonkNamesForDay(
  sliceDate: Date,
  konkName?: string,
): Promise<string[]> {
  if (konkName) return [konkName];

  const metas = await SkuSliceDayMeta.find({ date: sliceDate })
    .select("konkName")
    .lean();
  if (metas.length > 0) {
    return metas
      .map((m) => m.konkName)
      .filter((k): k is string => typeof k === "string" && k.length > 0);
  }

  const month = toSliceMonthDate(sliceDate);
  const dayKey = toSliceMonthDayKey(sliceDate);
  const konks = await SkuSliceMonth.distinct("konkName", {
    month,
    [`days.${dayKey}`]: { $exists: true },
  });
  return konks.filter((k): k is string => typeof k === "string" && k.length > 0);
}

/**
 * Повторный опрос позиций SkuSliceMonth за sliceDate: -1/-1 или цена не конечное неотрицательное число.
 * Если ответ опроса не в режиме полного -1/-1, перезаписывает ключ дня в months.
 */
export async function runCompensatingSkuSlices(
  sliceDate: Date,
  options?: RunCompensatingSkuSlicesOptions,
): Promise<{ refetched: number; updated: number }> {
  const day = toSliceDate(sliceDate);
  const excluded = getCompensationExcludedCompetitorSet("skuSlices");
  const konkNames = await resolveKonkNamesForDay(day, options?.konkName);

  const docs: Array<{ konkName: string; data?: Record<string, unknown> }> = [];
  for (const konkName of konkNames) {
    const data = await loadDayMapForKonk(konkName, day);
    docs.push({ konkName, data });
  }

  const queue = buildCompensatingDataKeyQueue(
    docs,
    excluded,
    shouldRefetchSkuSliceItem,
  );

  const updatedByKonk = new Map<string, Set<string>>();

  const stats = await runCompensatingSliceRefetchLoop(
    queue,
    async ({ konkName, dataKey }) => {
      const productKey = dataKey;
      try {
        const sku = (await Sku.findOne({ konkName, productId: productKey })
          .select("_id")
          .lean()) as SkuIdLean | null;
        if (!sku) {
          logModuleWarn(
            "slice-compensation",
            "compensating sku: entity not found, skip",
            { konkName, productKey },
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
          await upsertDayPoint(konkName, productKey, day, dataItem);
          updated = 1;
          const set = updatedByKonk.get(konkName) ?? new Set<string>();
          set.add(productKey);
          updatedByKonk.set(konkName, set);
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
          logModuleWarn(
            "slice-compensation",
            "unsupported konk, skipping refetch",
            {
              konkName,
              productKey,
            },
          );
          return { refetched: 0, updated: 0 };
        }
        const msg = err instanceof Error ? err.message : String(err);
        logModuleError(
          "slice-compensation",
          err,
          "compensating sku slice refetch failed",
          {
            konkName,
            productKey,
            message: msg,
          },
        );
        return { refetched: 0, updated: 0 };
      }
    },
    {
      onProgress: options?.onProgress,
      signal: options?.signal,
    },
  );

  for (const [konkName, productIds] of updatedByKonk) {
    await afterSkuSliceStockMutation({
      konkName,
      dayD: day,
      productIds: [...productIds],
    });
  }

  return stats;
}
