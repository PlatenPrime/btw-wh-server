import { Sku } from "../../skus/models/Sku.js";
import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../models/SkuSlice.js";
import { toSliceDate } from "../../../utils/sliceDate.js";

const DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SkuLean = {
  _id: { toString(): string };
  productId?: string;
};

/**
 * Собирает срез по всем SKU конкурента: upsert документа, затем по каждому SKU
 * с паузой 1 с — запись в data[productId]. Ошибка по одному SKU не рвёт цикл.
 */
export async function runSkuSliceForKonkUtil(
  konkName: string,
  date: Date
): Promise<{ saved: boolean; count: number }> {
  const sliceDate = toSliceDate(date);
  const skus = (await Sku.find({ konkName })
    .select("_id productId")
    .lean()) as SkuLean[];

  await SkuSlice.findOneAndUpdate(
    { konkName, date: sliceDate },
    { $setOnInsert: { konkName, date: sliceDate, data: {} } },
    { upsert: true }
  );

  let count = 0;
  const withPid = skus.filter((s) => (s.productId ?? "").trim() !== "");

  for (let i = 0; i < withPid.length; i++) {
    const sku = withPid[i]!;
    const skuId = sku._id.toString();
    const productKey = sku.productId!.trim();

    console.log(`[SkuSlice ${konkName}] анализируется SKU ${productKey}`);

    try {
      const result = await getSkuStockDataUtil(skuId);
      if (result) {
        const dataItem = { stock: result.stock, price: result.price };
        await SkuSlice.findOneAndUpdate(
          { konkName, date: sliceDate },
          { $set: { [`data.${productKey}`]: dataItem } }
        );
        count += 1;
      }
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === UNSUPPORTED_KONK_CODE) {
        console.warn(
          `[SkuSlice ${konkName}] неподдерживаемый конкурент для stock, срез прерван`
        );
        break;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[SkuSlice ${konkName}] ${productKey}: ${msg}`);
    }

    if (i < withPid.length - 1) {
      await delay(DELAY_MS);
    }
  }

  return { saved: true, count };
}
