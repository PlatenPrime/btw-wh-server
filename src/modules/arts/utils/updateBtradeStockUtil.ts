import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { Art, IArt } from "../models/Art.js";
import { logModuleError, logModuleWarn } from "../../../logging/logModuleError.js";

type UpdateBtradeStockUtilInput = {
  artikul: string;
};

/**
 * Обновляет btradeStock для одного артикула данными с sharik.ua
 * @param artikul - артикул товара
 * @returns Promise с обновленным артикулом или null, если артикул не найден
 */
export const updateBtradeStockUtil = async ({
  artikul,
}: UpdateBtradeStockUtilInput): Promise<IArt | null> => {
  try {
    // Получаем данные с sharik.ua
    const sharikData = await getSharikStockData(artikul);

    if (!sharikData) {
      logModuleWarn("arts", "product not found on sharik.ua", { artikul });
      return null;
    }

    // Обновляем btradeStock в базе данных
    const updatedArt: IArt | null = await Art.findOneAndUpdate(
      { artikul },
      {
        btradeStock: {
          value: sharikData.quantity,
          date: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
        select:
          "artikul zone namerus nameukr limit marker btradeStock createdAt updatedAt",
      }
    );

    return updatedArt;
  } catch (error) {
    logModuleError("arts", error, "failed to update btrade stock", { artikul });
    throw error;
  }
};

