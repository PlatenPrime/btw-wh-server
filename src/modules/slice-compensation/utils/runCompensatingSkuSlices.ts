import { Sku } from "../../skus/models/Sku.js";
import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../../sku-slices/models/SkuSlice.js";
import {
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../../slices/config/excludedCompetitors.js";
import { isFullMinusOneSliceItem } from "./isFullMinusOneSliceItem.js";

const DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SkuSliceLean = {
  konkName: string;
  data?: Record<string, unknown>;
};

type SkuIdLean = { _id: { toString(): string } };

/**
 * Повторный опрос позиций SkuSlice за sliceDate с data entry stock/price оба -1.
 * При ответе, где уже не оба -1, перезаписывает ключ в том же документе.
 */
export async function runCompensatingSkuSlices(
  sliceDate: Date
): Promise<{ refetched: number; updated: number }> {
  const excluded = getExcludedCompetitorSet("skuSlices");
  const docs = (await SkuSlice.find({ date: sliceDate })
    .select("konkName data")
    .lean()) as SkuSliceLean[];

  type Work = { konkName: string; productKey: string };
  const queue: Work[] = [];

  for (const doc of docs) {
    const kn = doc.konkName ?? "";
    if (excluded.has(normalizeCompetitorName(kn))) continue;
    const data = doc.data ?? {};
    for (const [productKey, item] of Object.entries(data)) {
      if (isFullMinusOneSliceItem(item)) {
        queue.push({ konkName: kn, productKey });
      }
    }
  }

  let refetched = 0;
  let updated = 0;

  for (let i = 0; i < queue.length; i++) {
    const { konkName, productKey } = queue[i]!;
    try {
      const sku = (await Sku.findOne({ konkName, productId: productKey })
        .select("_id")
        .lean()) as SkuIdLean | null;
      if (!sku) {
        console.warn(
          `[CompensatingSkuSlices] нет SKU ${productKey} у ${konkName}, пропуск`
        );
        continue;
      }
      const result = await getSkuStockDataUtil(sku._id.toString());
      if (!result) continue;
      refetched += 1;
      if (!(result.stock === -1 && result.price === -1)) {
        const dataItem = { stock: result.stock, price: result.price };
        await SkuSlice.findOneAndUpdate(
          { konkName, date: sliceDate },
          { $set: { [`data.${productKey}`]: dataItem } }
        );
        updated += 1;
      }
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === UNSUPPORTED_KONK_CODE) {
        console.warn(
          `[CompensatingSkuSlices] неподдерживаемый конкурент, пропуск ${konkName} ${productKey}`
        );
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[CompensatingSkuSlices] ${konkName} ${productKey}: ${msg}`
      );
    }
    if (i < queue.length - 1) {
      await delay(DELAY_MS);
    }
  }

  return { refetched, updated };
}
