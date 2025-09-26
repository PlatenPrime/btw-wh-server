import { sendMessageToPlaten } from "../../../utils/sendTelegramMessages.js";
import { ISharikStocksResult } from "../../poses/utils/getSharikStocks.js";

/**
 * Отправляет уведомление о начале расчета дефицитов
 */
export const sendDefCalculationStartNotification = async (): Promise<void> => {
  try {
    await sendMessageToPlaten(
      "🔄 <b>Начало расчета дефицитов</b>\n\nРасчет дефицитов запущен..."
    );
  } catch (error) {
    console.error("Failed to send start notification to Platen:", error);
    // Не выбрасываем ошибку, чтобы не прерывать основной процесс
  }
};

/**
 * Отправляет уведомление о завершении расчета дефицитов с результатами
 * @param result - результат расчета дефицитов
 */
export const sendDefCalculationCompleteNotification = async (
  result: ISharikStocksResult
): Promise<void> => {
  try {
    const totalDeficits = Object.keys(result).length;

    let message =
      `✅ <b>Расчет дефицитов завершен</b>\n\n` +
      `📊 <b>Результаты:</b>\n` +
      `• Найдено дефицитов: <b>${totalDeficits}</b>\n` +
      `• Документ сохранен в БД\n`;

    if (totalDeficits === 0) {
      message += `\n🎉 <b>Отлично! Дефицитов не найдено</b>\nВсе артикулы в норме`;
    } else {
      // Формируем список дефицитных артикулов с difQuant
      const deficitList = Object.entries(result)
        .map(([artikul, data]) => {
          const difQuant = data.difQuant || 0;
          const quant = data.quant || 0;
          const limit = data.limit || 0;
          const status =
            difQuant <= 0 ? "🔴 Дефицит" : "🟡 Приближение к лимиту";
          return `• <b>${artikul}</b>: ${difQuant} (${status})\n  └ Текущий остаток: ${quant}, Лимит: ${limit}`;
        })
        .join("\n");

      message += `\n📋 <b>Список дефицитов:</b>\n${deficitList}`;
    }

    await sendMessageToPlaten(message);
  } catch (error) {
    console.error("Failed to send completion notification to Platen:", error);
    // Не выбрасываем ошибку, чтобы не прерывать основной процесс
  }
};

/**
 * Отправляет уведомление об ошибке при расчете дефицитов
 * @param error - ошибка, которая произошла
 */
export const sendDefCalculationErrorNotification = async (
  error: unknown
): Promise<void> => {
  try {
    const errorMessage =
      `❌ <b>Ошибка при расчете дефицитов</b>\n\n` +
      `Ошибка: <code>${
        error instanceof Error ? error.message : "Unknown error"
      }</code>`;

    await sendMessageToPlaten(errorMessage);
  } catch (telegramError) {
    console.error(
      "Failed to send error notification to Platen:",
      telegramError
    );
    // Не выбрасываем ошибку, чтобы не прерывать основной процесс
  }
};
