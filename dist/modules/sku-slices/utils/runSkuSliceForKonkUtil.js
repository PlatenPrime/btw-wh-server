import { Sku } from "../../skus/models/Sku.js";
import { Skugr } from "../../skugrs/models/Skugr.js";
import { getSkuStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../../skus/utils/getSkuStockDataUtil.js";
import { isInvalidSliceStockResult } from "../../slices/utils/isInvalidSliceStockResult.js";
import { SkuSlice } from "../models/SkuSlice.js";
import { createLogger } from "../../../logging/createLogger.js";
import { delay } from "../../../utils/delay.js";
import { jitterMs } from "../../../utils/jitterMs.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { SKU_SLICE_REQUEST_JITTER_MAX_MS, SKU_SLICE_REQUEST_JITTER_MIN_MS, } from "../../sku-reporting/constants/skuSliceRequestJitterMs.js";
async function fetchSkuStockWithRetry(konkName, productKey, skuId) {
    const log = createLogger({ module: "sku-slices", konkName });
    const delays = [1000, 3000, 5000];
    let lastError = null;
    for (let attempt = 1; attempt <= delays.length; attempt++) {
        try {
            return await getSkuStockDataUtil(skuId);
        }
        catch (err) {
            const e = err;
            if (e.code === UNSUPPORTED_KONK_CODE) {
                throw e;
            }
            lastError = err;
            const msg = err instanceof Error ? err.message : String(err);
            log.warn({ productKey, attempt, maxAttempts: delays.length, err: msg }, "sku stock fetch attempt failed");
            if (attempt < delays.length) {
                const waitMs = delays[attempt - 1];
                log.warn({ productKey, waitMs }, "sku stock fetch retry scheduled");
                await delay(waitMs);
            }
        }
    }
    throw lastError ?? new Error("Unknown error in fetchSkuStockWithRetry");
}
export async function runSkuSliceForKonkUtil(konkName, date) {
    const log = createLogger({ module: "sku-slices", konkName });
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
    let invalid = 0;
    let errors = 0;
    const total = skus.length;
    const withPid = skus.filter((s) => (s.productId ?? "").trim() !== "");
    invalid += total - withPid.length;
    for (let i = 0; i < withPid.length; i++) {
        const sku = withPid[i];
        const skuId = sku._id.toString();
        const productKey = sku.productId.trim();
        log.debug({ productKey, index: i + 1, total: withPid.length }, "processing sku for slice");
        try {
            const result = await fetchSkuStockWithRetry(konkName, productKey, skuId);
            if (result == null) {
                invalid += 1;
                continue;
            }
            const dataItem = { stock: result.stock, price: result.price };
            await SkuSlice.findOneAndUpdate({ konkName, date: sliceDate }, { $set: { [`data.${productKey}`]: dataItem } });
            if (isInvalidSliceStockResult(result)) {
                invalid += 1;
            }
            else {
                count += 1;
            }
        }
        catch (err) {
            const e = err;
            if (e.code === UNSUPPORTED_KONK_CODE) {
                log.warn("unsupported konk for stock fetch, slice aborted");
                errors += withPid.length - i;
                break;
            }
            errors += 1;
            const msg = err instanceof Error ? err.message : String(err);
            log.error({ productKey, err: msg }, "sku slice item failed");
        }
        if (i < withPid.length - 1) {
            await delay(jitterMs(SKU_SLICE_REQUEST_JITTER_MIN_MS, SKU_SLICE_REQUEST_JITTER_MAX_MS));
        }
    }
    return { saved: true, count, total, invalid, errors };
}
