import { CronJob } from "cron";
import { formatCompensatingSlicesReport } from "../../../cron/analytics-notifications/formatCompensatingSlicesReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { runCompensatingAnalogSlices } from "../utils/runCompensatingAnalogSlices.js";
import { runCompensatingSkuSlices } from "../utils/runCompensatingSkuSlices.js";
const log = createLogger({ module: "slice-compensation", job: "cron" });
/**
 * Компенсирующие срезы: 09:10 и 16:10 по Киеву — повторный опрос позиций с -1/-1
 * в сегодняшних AnalogSlice и SkuSlice.
 */
export function startCompensatingSlicesCron() {
    const job = new CronJob("0 30 10 * * *", async () => {
        try {
            const sliceDate = toSliceDate(new Date());
            const sliceDateLabel = sliceDate.toISOString().slice(0, 10);
            log.info({ sliceDateLabel }, "starting compensating slices");
            const [analog, sku] = await Promise.all([
                runCompensatingAnalogSlices(sliceDate),
                runCompensatingSkuSlices(sliceDate),
            ]);
            log.info({ analog, sku }, "compensating slices completed");
            await sendCronAnalyticsReport(formatCompensatingSlicesReport({
                sliceDateLabel,
                analog,
                sku,
            }));
        }
        catch (error) {
            log.error({ err: error }, "compensating slices cron failed");
            await sendCronAnalyticsReport(formatCronErrorReport("Compensating slices", error));
        }
    }, null, true, "Europe/Kiev");
    log.info({ schedule: "0 30 10 * * *", timezone: "Europe/Kiev" }, "cron started");
    return job;
}
