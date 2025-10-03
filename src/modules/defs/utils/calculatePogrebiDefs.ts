import { getPogrebiDefStocks } from "../../poses/utils/getPogrebiDefStocks.js";
import {
  getSharikStocks,
  ISharikStocksResult,
} from "../../poses/utils/getSharikStocks.js";
import { Def, IDef } from "../models/Def.js";
import { calculateDeficitTotals } from "./calculateTotals.js";
import {
  finishCalculationTracking,
  startCalculationTracking,
  updateCalculationProgress,
} from "./calculationStatus.js";
import { sendDefCalculationCompleteNotification } from "./defs-tg-notifications/sendDefCalculationCompleteNotification.js";
import { sendDefCalculationErrorNotification } from "./defs-tg-notifications/sendDefCalculationErrorNotification.js";
import { sendDefCalculationStartNotification } from "./defs-tg-notifications/sendDefCalculationStartNotification.js";
import { filterDeficits } from "./filterDeficits.js";
import { getArtLimits } from "./getArtLimits.js";
import { getSharikStocksWithProgress } from "./getSharikStocksWithProgress.js";

export async function calculatePogrebiDefs() {
  const pogrebiDefStocks = await getPogrebiDefStocks();
  const artikuls = Object.keys(pogrebiDefStocks);
  const limits = await getArtLimits(artikuls);
  const defs = await getSharikStocks(pogrebiDefStocks, limits);
  const filteredDefs = filterDeficits(defs);

  return filteredDefs;
}

/**
 * Выполняет расчет дефицитов и сохраняет результат в базу данных
 * @returns Promise<IDef> - сохраненный документ с результатами расчета
 * @throws Error - если произошла ошибка при расчете или сохранении
 */
export async function calculateAndSavePogrebiDefs(): Promise<IDef> {
  try {
    // Отправляем уведомление о начале расчета
    await sendDefCalculationStartNotification();

    // Получаем данные для расчета
    updateCalculationProgress(0, 100, "Отримання даних складу...");
    const pogrebiDefStocks = await getPogrebiDefStocks();
    const artikuls = Object.keys(pogrebiDefStocks);

    // Запускаем отслеживание прогресса
    startCalculationTracking(artikuls.length + 2); // +2 для получения лимитов и сохранения

    updateCalculationProgress(
      1,
      artikuls.length + 2,
      "Отримання лімітів артикулів..."
    );
    const limits = await getArtLimits(artikuls);

    updateCalculationProgress(
      2,
      artikuls.length + 2,
      "Обробка даних Sharik..."
    );
    // Используем функцию с отслеживанием прогресса
    const result: ISharikStocksResult = await getSharikStocksWithProgress(
      pogrebiDefStocks,
      limits
    );

    updateCalculationProgress(
      artikuls.length + 1,
      artikuls.length + 2,
      "Фільтрація дефіцитів..."
    );
    const filteredDefs = filterDeficits(result);

    updateCalculationProgress(
      artikuls.length + 2,
      artikuls.length + 2,
      "Збереження в базу даних..."
    );

    // Розраховуємо ітогові значення
    const totals = calculateDeficitTotals(filteredDefs);

    // Створюємо і зберігаємо документ в базу даних
    const def = new Def({
      result: filteredDefs,
      total: totals.total,
      totalCriticalDefs: totals.totalCriticalDefs,
      totalLimitDefs: totals.totalLimitDefs,
    });

    const savedDef = await def.save();

    // Відправляємо повідомлення про завершення з результатами
    await sendDefCalculationCompleteNotification(filteredDefs);

    // Завершаємо відстеження
    finishCalculationTracking();

    return savedDef;
  } catch (error) {
    console.error("Помилка в calculateAndSavePogrebiDefs:", error);

    // Завершаем отслеживание при ошибке
    finishCalculationTracking();

    // Відправляємо повідомлення про помилку
    await sendDefCalculationErrorNotification(error);

    throw new Error(
      `Не вдалося розрахувати і зберегти дефіцити: ${
        error instanceof Error ? error.message : "Невідома помилка"
      }`
    );
  }
}
