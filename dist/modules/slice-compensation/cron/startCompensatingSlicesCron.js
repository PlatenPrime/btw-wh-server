import { CronJob } from "cron";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { runCompensatingAnalogSlices } from "../utils/runCompensatingAnalogSlices.js";
import { runCompensatingSkuSlices } from "../utils/runCompensatingSkuSlices.js";
/**
 * Компенсирующие срезы: 09:10 и 16:10 по Киеву — повторный опрос позиций с -1/-1
 * в сегодняшних AnalogSlice и SkuSlice.
 */
export function startCompensatingSlicesCron() {
    const job = new CronJob("0 30 9,16 * * *", async () => {
        try {
            const sliceDate = toSliceDate(new Date());
            console.log(`[CRON CompensatingSlices] Starting for ${sliceDate.toISOString().slice(0, 10)}...`);
            const [analog, sku] = await Promise.all([
                runCompensatingAnalogSlices(sliceDate),
                runCompensatingSkuSlices(sliceDate),
            ]);
            console.log(`[CRON CompensatingSlices] Analog: refetched=${analog.refetched} updated=${analog.updated}`);
            console.log(`[CRON CompensatingSlices] Sku: refetched=${sku.refetched} updated=${sku.updated}`);
            console.log(`[CRON CompensatingSlices] Done`);
        }
        catch (error) {
            console.error(`[CRON CompensatingSlices] Error:`, error instanceof Error ? error.message : "Unknown error");
        }
    }, null, true, "Europe/Kiev");
    console.log(`[CRON CompensatingSlices] Started: 09:10 and 16:10 daily (Kiev time)`);
    return job;
}
