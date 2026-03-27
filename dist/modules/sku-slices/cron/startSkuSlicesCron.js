import { CronJob } from "cron";
import { Sku } from "../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../utils/runSkuSliceForKonkUtil.js";
import { getExcludedCompetitorSet, normalizeCompetitorName, } from "../../slices/config/excludedCompetitors.js";
/**
 * Ежедневно в 00:00 по Киеву: параллельно срез по каждому konkName, для которого есть SKU.
 */
export function startSkuSlicesCron() {
    const job = new CronJob("0 0 0 * * *", async () => {
        try {
            const names = await Sku.distinct("konkName");
            const excluded = getExcludedCompetitorSet("skuSlices");
            const uniqueNormalized = new Set();
            const konkNames = names
                .map((n) => (typeof n === "string" ? n.trim() : ""))
                .filter((name) => name.length > 0)
                .filter((name) => {
                const normalized = normalizeCompetitorName(name);
                if (excluded.has(normalized) || uniqueNormalized.has(normalized)) {
                    return false;
                }
                uniqueNormalized.add(normalized);
                return true;
            });
            const excludedFromData = names
                .map((n) => (typeof n === "string" ? n.trim() : ""))
                .filter((name) => name.length > 0)
                .filter((name) => excluded.has(normalizeCompetitorName(name)));
            console.log(`[CRON SkuSlices] Starting for ${konkNames.length} competitors...`);
            if (excludedFromData.length > 0) {
                console.log(`[CRON SkuSlices] Excluded competitors: ${excludedFromData.join(", ")}`);
            }
            const results = await Promise.all(konkNames.map(async (k) => {
                const r = await runSkuSliceForKonkUtil(k, new Date());
                return { k, count: r.count };
            }));
            const summary = results.map((r) => `${r.k}=${r.count}`).join(" ");
            console.log(`[CRON SkuSlices] Done: ${summary}`);
        }
        catch (error) {
            console.error(`[CRON SkuSlices] Error:`, error instanceof Error ? error.message : "Unknown error");
        }
    }, null, true, "Europe/Kiev");
    console.log(`[CRON SkuSlices] Started: daily at 00:00 (Kiev time)`);
    return job;
}
