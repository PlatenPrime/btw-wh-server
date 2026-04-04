import { Sku } from "../../skus/models/Sku.js";
import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../../sku-slices/models/SkuSlice.js";
import { getExcludedCompetitorSet } from "../../slices/config/excludedCompetitors.js";
import {
  buildCompensatingDataKeyQueue,
  runCompensatingSliceRefetchLoop,
} from "./compensatingSliceRunner.js";
import { shouldRefetchSkuSliceItem } from "./shouldRefetchSkuSliceItem.js";

type SkuSliceLean = {
  konkName: string;
  data?: Record<string, unknown>;
};

type SkuIdLean = { _id: { toString(): string } };

/**
 * Повторный опрос позиций SkuSlice за sliceDate: -1/-1 или цена не конечное неотрицательное число.
 * Если ответ опроса не в режиме полного -1/-1, перезаписывает ключ в том же документе.
 */
export async function runCompensatingSkuSlices(
  sliceDate: Date
): Promise<{ refetched: number; updated: number }> {
  const excluded = getExcludedCompetitorSet("skuSlices");
  const docs = (await SkuSlice.find({ date: sliceDate })
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
        console.warn(
          `[CompensatingSkuSlices] нет SKU ${productKey} у ${konkName}, пропуск`
        );
        return { refetched: 0, updated: 0 };
      }
      const result = await getSkuStockDataUtil(sku._id.toString());
      if (!result) return { refetched: 0, updated: 0 };
      let updated = 0;
      if (!(result.stock === -1 && result.price === -1)) {
        const dataItem = { stock: result.stock, price: result.price };
        await SkuSlice.findOneAndUpdate(
          { konkName, date: sliceDate },
          { $set: { [`data.${productKey}`]: dataItem } }
        );
        updated = 1;
      }
      return { refetched: 1, updated };
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === UNSUPPORTED_KONK_CODE) {
        console.warn(
          `[CompensatingSkuSlices] неподдерживаемый конкурент, пропуск ${konkName} ${productKey}`
        );
        return { refetched: 0, updated: 0 };
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[CompensatingSkuSlices] ${konkName} ${productKey}: ${msg}`
      );
      return { refetched: 0, updated: 0 };
    }
  });
}
