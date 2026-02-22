import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { ISharikStocksResult } from "../../poses/utils/getSharikStocks.js";
import { IMergedPosesResult } from "../../poses/utils/mergePoses.js";
import { updateCalculationProgress } from "./calculationStatus.js";

/**
 * Расширяет объекты массива stocks данными с сайта sharik.ua с отслеживанием прогресса
 * @param stocks - Объект с объединенными позициями по артикулам
 * @param limits - Объект с лимитами по артикулам из модели Art
 * @returns Promise с расширенными данными, включающими sharikQuant, difQuant и limit
 */
export async function getSharikStocksWithProgress(
  stocks: IMergedPosesResult,
  limits: { [artikul: string]: number } = {}
): Promise<ISharikStocksResult> {
  const startTime = performance.now();

  try {
    const extendedStocks: ISharikStocksResult = {};
    const artikuls = Object.keys(stocks);
    const totalItems = artikuls.length;

    console.log(`Початок обробки ${totalItems} артикулів`);

    // Обрабатываем каждый артикул последовательно с задержкой
    for (let i = 0; i < artikuls.length; i++) {
      const artikul = artikuls[i];

      try {
        const stockData = stocks[artikul];
        const sharikData = await getSharikStockData(artikul);

        // Если данные с Sharik получены, используем их
        if (sharikData) {
          const sharikQuant = sharikData.quantity;
          const difQuant = sharikQuant - stockData.quant;

          extendedStocks[artikul] = {
            ...stockData,
            sharikQuant,
            difQuant,
            limit: limits[artikul],
          };
        } else {
          // Если данные не получены, устанавливаем нулевые значения
          extendedStocks[artikul] = {
            ...stockData,
            sharikQuant: 0,
            difQuant: -stockData.quant, // Разница будет отрицательной
            limit: limits[artikul],
          };
        }
      } catch (error) {
        console.warn(
          `Помилка при отриманні даних Sharik для артикула ${artikul}:`,
          error
        );

        // В разі помилки встановлюємо нульові значення
        extendedStocks[artikul] = {
          ...stocks[artikul],
          sharikQuant: 0,
          difQuant: -stocks[artikul].quant,
          limit: limits[artikul],
        };
      }

      // Додаємо затримку між запитами (крім останнього)
      if (i < artikuls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms задержка
      }

      // Оновлюємо прогресс кожні 5 артикулів або на останньому елементі
      if ((i + 1) % 5 === 0 || i === artikuls.length - 1) {
        updateCalculationProgress(
          i + 1,
          totalItems,
          `Обробка даних Sharik: ${i + 1} з ${totalItems} артикулів`
        );

        console.log(`Оброблено ${i + 1} з ${totalItems} артикулів`);
      }
    }

    const endTime = performance.now();
    const duration = Math.round((endTime - startTime) / 1000);
    console.log(
      `Обробка ${totalItems} артикулів завершена за ${duration} секунд`
    );

    return extendedStocks;
  } catch (error) {
    console.error("Помилка в getSharikStocksWithProgress:", error);
    throw error;
  }
}
