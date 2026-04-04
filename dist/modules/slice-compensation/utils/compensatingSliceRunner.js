import { delay } from "../../../utils/delay.js";
import { jitterMs } from "../../../utils/jitterMs.js";
import { SKU_SLICE_REQUEST_JITTER_MAX_MS, SKU_SLICE_REQUEST_JITTER_MIN_MS, } from "../../sku-slices/constants/skuSliceRequestJitterMs.js";
import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
export function buildCompensatingDataKeyQueue(docs, excluded, shouldInclude) {
    const queue = [];
    for (const doc of docs) {
        const kn = doc.konkName ?? "";
        if (excluded.has(normalizeCompetitorName(kn)))
            continue;
        const data = doc.data ?? {};
        for (const [dataKey, item] of Object.entries(data)) {
            if (shouldInclude(item)) {
                queue.push({ konkName: kn, dataKey });
            }
        }
    }
    return queue;
}
/**
 * Последовательная обработка очереди с jitter между итерациями (как при сборе SkuSlice).
 */
export async function runCompensatingSliceRefetchLoop(queue, processItem, jitterMinMs = SKU_SLICE_REQUEST_JITTER_MIN_MS, jitterMaxMs = SKU_SLICE_REQUEST_JITTER_MAX_MS) {
    let refetched = 0;
    let updated = 0;
    for (let i = 0; i < queue.length; i++) {
        const stats = await processItem(queue[i]);
        refetched += stats.refetched;
        updated += stats.updated;
        if (i < queue.length - 1) {
            await delay(jitterMs(jitterMinMs, jitterMaxMs));
        }
    }
    return { refetched, updated };
}
