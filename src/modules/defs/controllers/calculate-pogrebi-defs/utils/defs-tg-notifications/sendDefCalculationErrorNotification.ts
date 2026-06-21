import { sendMessageToDefsChat } from "../../../../../../utils/telegram/sendMessageToDefsChat.js";
import { logModuleError } from "../../../../../../logging/logModuleError.js";

export const sendDefCalculationErrorNotification = async (
  error: unknown
): Promise<void> => {
  try {
    const errorMessage =
      `❌ <b>Помилка при розрахунку дефіцитів</b>\n\n` +
      `Помилка: <code>${
        error instanceof Error ? error.message : "Невідома помилка"
      }</code>`;

    await sendMessageToDefsChat(errorMessage);
  } catch (telegramError) {
    logModuleError("defs", telegramError, "Failed to send error notification to Defs Chat:");
    // Не викидаємо помилку, щоб не переривати основний процес
  }
};

