import { getCachedSharikProductRestsMap } from "../../browser/sharik/utils/product-rests/index.js";
import { logModuleError, logModuleInfo } from "../../../logging/logModuleError.js";
/**
 * Расширяет stocks данными product_rests (actualQuantity) одним запросом/cache.
 * nameukr/quant остаются из poses.
 */
export async function getSharikStocks(stocks, limits = {}) {
    const startTime = performance.now();
    try {
        const artikuls = Object.keys(stocks);
        logModuleInfo("poses", "sharik stocks fetch started", {
            artikulCount: artikuls.length,
        });
        const productRestsMap = await getCachedSharikProductRestsMap();
        const extendedStocks = {};
        for (const artikul of artikuls) {
            const stockData = stocks[artikul];
            const row = productRestsMap.get(artikul);
            const sharikQuant = row?.actualQuantity ?? 0;
            extendedStocks[artikul] = {
                ...stockData,
                sharikQuant,
                difQuant: sharikQuant - stockData.quant,
                limit: limits[artikul],
            };
        }
        const endTime = performance.now();
        logModuleInfo("poses", "sharik stocks fetch completed", {
            artikulCount: artikuls.length,
            executionTimeMs: Number((endTime - startTime).toFixed(2)),
        });
        return extendedStocks;
    }
    catch (error) {
        const endTime = performance.now();
        logModuleError("poses", error, "failed to fetch sharik stocks", {
            executionTimeMs: Number((endTime - startTime).toFixed(2)),
        });
        throw new Error("Не удалось получить данные Sharik");
    }
}
