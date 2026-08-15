import { formatCronErrorReport } from "../../../../cron/analytics-notifications/formatCronReports.js";
import { formatGraboSkuSyncReport } from "../../../../cron/analytics-notifications/formatGraboSkuSyncReport.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { releaseGraboSkuSync, tryAcquireGraboSkuSync, } from "../../utils/graboSkuSyncLock.js";
import { runGraboSkuSyncUtil } from "../../utils/runGraboSkuSyncUtil.js";
async function runGraboSkuSyncInBackground(userId) {
    try {
        const stats = await runGraboSkuSyncUtil();
        await sendCronAnalyticsReport(formatGraboSkuSyncReport(stats));
        if (userId) {
            await createEventUtil({
                userId,
                department: "grabo-skus",
                type: "other",
                description: `Запущено синхронізацію каталогу Grabo: listed ${stats.listed}, created ${stats.created}, updated ${stats.updated}`,
            });
        }
    }
    catch (error) {
        logModuleError("grabo-skus", error, "grabo sku sync failed");
        await sendCronAnalyticsReport(formatCronErrorReport("Grabo SKU sync", error));
    }
    finally {
        releaseGraboSkuSync();
    }
}
/**
 * @desc    Ручной срез каталога Grabo (фон, 202)
 * @route   POST /api/grabo-skus/sync
 */
export const runGraboSkuSyncController = async (req, res) => {
    if (!tryAcquireGraboSkuSync()) {
        res.status(409).json({
            message: "Grabo SKU sync already running",
        });
        return;
    }
    const userId = req.user?.id;
    res.status(202).json({
        message: "Grabo SKU sync accepted",
        data: { accepted: true },
    });
    void runGraboSkuSyncInBackground(userId);
};
