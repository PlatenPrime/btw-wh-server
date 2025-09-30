import { sendMessageToDefsChat } from "../../../../utils/telegram/sendMessageToDefsChat.js";
export const sendDefCalculationErrorNotification = async (error) => {
    try {
        const errorMessage = `❌ <b>Помилка при розрахунку дефіцитів</b>\n\n` +
            `Помилка: <code>${error instanceof Error ? error.message : "Невідома помилка"}</code>`;
        await sendMessageToDefsChat(errorMessage);
    }
    catch (telegramError) {
        console.error("Failed to send error notification to Defs Chat:", telegramError);
        // Не викидаємо помилку, щоб не переривати основний процес
    }
};
