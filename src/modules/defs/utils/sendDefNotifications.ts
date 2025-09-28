import { sendMessageToPlaten } from "../../../utils/sendTelegramMessages.js";
import { IDeficitCalculationResult } from "../models/Defcalc.js";

/**
 * Відправляє повідомлення про початок розрахунку дефіцитів
 */
export const sendDefCalculationStartNotification = async (): Promise<void> => {
  try {
    await sendMessageToPlaten(
      "🔄 <b>Початок розрахунку дефіцитів</b>\n\nРозрахунок дефіцитів запущено..."
    );
  } catch (error) {
    console.error("Failed to send start notification to Platen:", error);
    // Не викидаємо помилку, щоб не переривати основний процес
  }
};

/**
 * Відправляє повідомлення про завершення розрахунку дефіцитів з результатами
 * @param result - результат розрахунку дефіцитів
 */
export const sendDefCalculationCompleteNotification = async (
  result: IDeficitCalculationResult
): Promise<void> => {
  try {
    const totalDeficits = Object.keys(result).length;

    let message =
      `✅ <b>Розрахунок дефіцитів завершено</b>\n\n` +
      `📊 <b>Результати:</b>\n` +
      `• Знайдено дефіцитів: <b>${totalDeficits}</b>\n` +
      `• Документ збережено в БД\n`;

    if (totalDeficits === 0) {
      message += `\n🎉 <b>Відмінно! Дефіцитів не знайдено</b>\nВсі артикули в нормі`;
    } else {
      // Формуємо список дефіцитних артикулів з difQuant
      const deficitList = Object.entries(result)
        .map(([artikul, data]) => {
          const difQuant = data.difQuant || 0;
          const quant = data.quant || 0;
          const defLimit = data.defLimit || 0;
          const status =
            difQuant <= 0 ? "🔴 Критичний дефіцит" : "🟡 Лімітований дефіцит";
          return `• <b>${artikul}</b>: ${difQuant} (${status})\n  └ Поточний залишок: ${quant}, Ліміт дефіциту: ${defLimit}`;
        })
        .join("\n");

      message += `\n📋 <b>Список дефіцитів:</b>\n${deficitList}`;
    }

    await sendMessageToPlaten(message);
  } catch (error) {
    console.error("Failed to send completion notification to Platen:", error);
    // Не викидаємо помилку, щоб не переривати основний процес
  }
};

/**
 * Відправляє повідомлення про помилку при розрахунку дефіцитів
 * @param error - помилка, яка сталася
 */
export const sendDefCalculationErrorNotification = async (
  error: unknown
): Promise<void> => {
  try {
    const errorMessage =
      `❌ <b>Помилка при розрахунку дефіцитів</b>\n\n` +
      `Помилка: <code>${
        error instanceof Error ? error.message : "Невідома помилка"
      }</code>`;

    await sendMessageToPlaten(errorMessage);
  } catch (telegramError) {
    console.error(
      "Failed to send error notification to Platen:",
      telegramError
    );
    // Не викидаємо помилку, щоб не переривати основний процес
  }
};
