import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { Art } from "../models/Art.js";

type UpdateAllBtradeStocksResult = {
  total: number;
  updated: number;
  errors: number;
  notFound: number;
};

/**
 * Обновляет btradeStock для всех артикулов данными с sharik.ua
 * Использует очередность с задержкой 100ms между запросами
 * @returns Promise со статистикой обновления
 */
export const updateAllBtradeStocksUtil =
  async (): Promise<UpdateAllBtradeStocksResult> => {
    const startTime = performance.now();

    try {
      // Получаем все артикулы
      const arts = await Art.find().select("artikul").lean();
      const artikuls = arts.map((art) => art.artikul);
      const totalItems = artikuls.length;

      console.log(`Начало обновления btradeStock для ${totalItems} артикулов`);

      const result: UpdateAllBtradeStocksResult = {
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
            console.warn(
              `Товар с артикулом ${artikul} не найден на sharik.ua`
            );
            result.notFound++;
            continue;
          }

          // Обновляем btradeStock в базе данных
          await Art.findOneAndUpdate(
            { artikul },
            {
              btradeStock: {
                value: sharikData.quantity,
                date: new Date(),
              },
            },
            {
              runValidators: true,
            }
          );

          result.updated++;
        } catch (error) {
          console.error(
            `Ошибка при обновлении btradeStock для артикула ${artikul}:`,
            error
          );
          result.errors++;
        }

        // Добавляем задержку между запросами (кроме последнего)
        if (i < artikuls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms задержка
        }

        // Логируем прогресс каждые 10 артикулов
        if ((i + 1) % 10 === 0 || i === artikuls.length - 1) {
          console.log(
            `Обработано ${i + 1} из ${artikuls.length} артикулов. Обновлено: ${result.updated}, Ошибок: ${result.errors}, Не найдено: ${result.notFound}`
          );
        }
      }

      const endTime = performance.now();
      const duration = Math.round((endTime - startTime) / 1000);
      console.log(
        `Обновление btradeStock для ${totalItems} артикулов завершено за ${duration} секунд`
      );

      return result;
    } catch (error) {
      console.error("Ошибка в updateAllBtradeStocksUtil:", error);
      throw error;
    }
  };

