import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { Art } from "../models/Art.js";
import { logModuleError, logModuleInfo, logModuleWarn } from "../../../logging/logModuleError.js";
/**
 * Обновляет btradeStock для всех артикулов данными с sharik.ua
 * Использует очередность с задержкой 100ms между запросами
 * @returns Promise со статистикой обновления
 */
export const updateAllBtradeStocksUtil = async () => {
    const startTime = performance.now();
    try {
        // Получаем все артикулы
        const arts = await Art.find().select("artikul").lean();
        const artikuls = arts.map((art) => art.artikul);
        const totalItems = artikuls.length;
        logModuleInfo("arts", "btrade stock update started", { totalItems });
        const result = {
            total: totalItems,
            updated: 0,
            errors: 0,
            notFound: 0,
        };
        // Обрабатываем каждый артикул последовательно с задержкой
        for (let i = 0; i < artikuls.length; i++) {
            const artikul = artikuls[i];
            try {
                // Получаем данные с sharik.ua
                const sharikData = await getSharikStockData(artikul);
                if (!sharikData) {
                    logModuleWarn("arts", "product not found on sharik.ua", { artikul });
                    result.notFound++;
                    continue;
                }
                // Обновляем btradeStock в базе данных
                await Art.findOneAndUpdate({ artikul }, {
                    btradeStock: {
                        value: sharikData.quantity,
                        date: new Date(),
                    },
                }, {
                    runValidators: true,
                });
                result.updated++;
            }
            catch (error) {
                logModuleError("arts", error, "failed to update btrade stock", { artikul });
                result.errors++;
            }
            // Добавляем задержку между запросами (кроме последнего)
            if (i < artikuls.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms задержка
            }
            // Логируем прогресс каждые 10 артикулов
            if ((i + 1) % 10 === 0 || i === artikuls.length - 1) {
                logModuleInfo("arts", "btrade stock update progress", {
                    processed: i + 1,
                    totalItems: artikuls.length,
                    updated: result.updated,
                    errors: result.errors,
                    notFound: result.notFound,
                });
            }
        }
        const endTime = performance.now();
        const duration = Math.round((endTime - startTime) / 1000);
        logModuleInfo("arts", "btrade stock update completed", {
            totalItems,
            durationSec: duration,
        });
        return result;
    }
    catch (error) {
        logModuleError("arts", error, "updateAllBtradeStocksUtil failed");
        throw error;
    }
};
