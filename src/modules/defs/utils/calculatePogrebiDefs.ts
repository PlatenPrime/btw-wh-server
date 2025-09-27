import { getPogrebiDefStocks } from "../../poses/utils/getPogrebiDefStocks.js";
import {
  getSharikStocks,
  ISharikStocksResult,
} from "../../poses/utils/getSharikStocks.js";
import { Defcalc, IDefcalc } from "../models/Defcalc.js";
import {
  finishCalculationTracking,
  startCalculationTracking,
  updateCalculationProgress,
} from "./calculationStatus.js";
import { filterDeficits } from "./filterDeficits.js";
import { getArtLimits } from "./getArtLimits.js";
import { getSharikStocksWithProgress } from "./getSharikStocksWithProgress.js";
import {
  sendDefCalculationCompleteNotification,
  sendDefCalculationErrorNotification,
  sendDefCalculationStartNotification,
} from "./sendDefNotifications.js";

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
 * @returns Promise<IDefcalc> - сохраненный документ с результатами расчета
 * @throws Error - если произошла ошибка при расчете или сохранении
 */
export async function calculateAndSavePogrebiDefs(): Promise<IDefcalc> {
  try {
    // Отправляем уведомление о начале расчета
    await sendDefCalculationStartNotification();

    // Получаем данные для расчета
    updateCalculationProgress(0, 100, "Получение данных склада...");
    const pogrebiDefStocks = await getPogrebiDefStocks();
    const artikuls = Object.keys(pogrebiDefStocks);

    // Запускаем отслеживание прогресса
    startCalculationTracking(artikuls.length + 2); // +2 для получения лимитов и сохранения

    updateCalculationProgress(
      1,
      artikuls.length + 2,
      "Получение лимитов артикулов..."
    );
    const limits = await getArtLimits(artikuls);

    updateCalculationProgress(
      2,
      artikuls.length + 2,
      "Обработка данных Sharik..."
    );
    // Используем функцию с отслеживанием прогресса
    const result: ISharikStocksResult = await getSharikStocksWithProgress(
      pogrebiDefStocks,
      limits
    );

    updateCalculationProgress(
      artikuls.length + 1,
      artikuls.length + 2,
      "Фильтрация дефицитов..."
    );
    const filteredDefs = filterDeficits(result);

    updateCalculationProgress(
      artikuls.length + 2,
      artikuls.length + 2,
      "Сохранение в базу данных..."
    );
    // Создаем и сохраняем документ в базу данных
    const defcalc = new Defcalc({
      result: filteredDefs,
    });

    const savedDefcalc = await defcalc.save();

    // Отправляем уведомление о завершении с результатами
    await sendDefCalculationCompleteNotification(filteredDefs);

    // Завершаем отслеживание
    finishCalculationTracking();

    return savedDefcalc;
  } catch (error) {
    console.error("Error in calculateAndSavePogrebiDefs:", error);

    // Завершаем отслеживание при ошибке
    finishCalculationTracking();

    // Отправляем уведомление об ошибке
    await sendDefCalculationErrorNotification(error);

    throw new Error(
      `Failed to calculate and save pogrebi deficits: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
