import { Art } from "../models/Art.js";
import { getCachedSharikProductRestsMap } from "../../browser/sharik/utils/product-rests/index.js";
import {
  logModuleError,
  logModuleInfo,
  logModuleWarn,
} from "../../../logging/logModuleError.js";

type UpdateAllBtradeStocksResult = {
  total: number;
  updated: number;
  errors: number;
  notFound: number;
};

/**
 * Обновляет btradeStock для всех артикулов данными product_rests (actualQuantity).
 * Один HTTP-запрос (или cache hit), затем обновления в Mongo.
 */
export const updateAllBtradeStocksUtil =
  async (): Promise<UpdateAllBtradeStocksResult> => {
    const startTime = performance.now();

    try {
      const arts = await Art.find().select("artikul").lean();
      const artikuls = arts.map((art) => art.artikul);
      const totalItems = artikuls.length;

      logModuleInfo("arts", "btrade stock update started", { totalItems });

      const result: UpdateAllBtradeStocksResult = {
        total: totalItems,
        updated: 0,
        errors: 0,
        notFound: 0,
      };

      if (totalItems === 0) {
        return result;
      }

      const productRestsMap = await getCachedSharikProductRestsMap();
      const now = new Date();

      for (const artikul of artikuls) {
        try {
          const row = productRestsMap.get(artikul);

          if (!row) {
            logModuleWarn("arts", "product not found on sharik.ua", { artikul });
            result.notFound++;
            continue;
          }

          await Art.findOneAndUpdate(
            { artikul },
            {
              btradeStock: {
                value: row.actualQuantity,
                date: now,
              },
            },
            {
              runValidators: true,
            }
          );

          result.updated++;
        } catch (error) {
          logModuleError("arts", error, "failed to update btrade stock", {
            artikul,
          });
          result.errors++;
        }
      }

      const endTime = performance.now();
      const duration = Math.round((endTime - startTime) / 1000);
      logModuleInfo("arts", "btrade stock update completed", {
        totalItems,
        durationSec: duration,
        updated: result.updated,
        errors: result.errors,
        notFound: result.notFound,
      });

      return result;
    } catch (error) {
      logModuleError("arts", error, "updateAllBtradeStocksUtil failed");
      throw error;
    }
  };
