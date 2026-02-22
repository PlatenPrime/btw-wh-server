import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { Art, IArt } from "../models/Art.js";

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
      console.warn(`Товар с артикулом ${artikul} не найден на sharik.ua`);
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
    console.error(
      `Ошибка при обновлении btradeStock для артикула ${artikul}:`,
      error
    );
    throw error;
  }
};

