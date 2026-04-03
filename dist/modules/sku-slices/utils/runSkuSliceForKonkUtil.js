import { Sku } from "../../skus/models/Sku.js";
import { Skugr } from "../../skugrs/models/Skugr.js";
import { getSkuStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../models/SkuSlice.js";
import { delay } from "../../../utils/delay.js";
import { jitterMs } from "../../../utils/jitterMs.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
const JITTER_MIN_MS = 500;
const JITTER_MAX_MS = 1500;
/**
 * Собирает срез по всем SKU конкурента: upsert документа, затем по каждому SKU
 * с паузой 500–1500 мс (jitter) — запись в data[productId]. Ошибка по одному SKU не рвёт цикл.
 */
export async function runSkuSliceForKonkUtil(konkName, date) {
    const sliceDate = toSliceDate(date);
    const skugrs = (await Skugr.find({ konkName, isSliced: true })
        .select("skus")
        .lean());
    const slicedSkuIds = Array.from(new Set(skugrs.flatMap((group) => (group.skus ?? []).map((skuId) => skuId.toString()))));
    const skus = (await Sku.find({ konkName, _id: { $in: slicedSkuIds } })
        .select("_id productId")
        .lean());
    await SkuSlice.findOneAndUpdate({ konkName, date: sliceDate }, { $setOnInsert: { konkName, date: sliceDate, data: {} } }, { upsert: true });
    let count = 0;
    const withPid = skus.filter((s) => (s.productId ?? "").trim() !== "");
    for (let i = 0; i < withPid.length; i++) {
        const sku = withPid[i];
        const skuId = sku._id.toString();
        const productKey = sku.productId.trim();
        console.log(`[SkuSlice ${konkName}] анализируется SKU ${productKey} (${i + 1} из ${withPid.length})`);
        try {
            const result = await getSkuStockDataUtil(skuId);
            if (result) {
                const dataItem = { stock: result.stock, price: result.price };
                await SkuSlice.findOneAndUpdate({ konkName, date: sliceDate }, { $set: { [`data.${productKey}`]: dataItem } });
                count += 1;
            }
        }
        catch (err) {
            const e = err;
            if (e.code === UNSUPPORTED_KONK_CODE) {
                console.warn(`[SkuSlice ${konkName}] неподдерживаемый конкурент для stock, срез прерван`);
                break;
            }
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[SkuSlice ${konkName}] ${productKey}: ${msg}`);
        }
        if (i < withPid.length - 1) {
            await delay(jitterMs(JITTER_MIN_MS, JITTER_MAX_MS));
        }
    }
    return { saved: true, count };
}
