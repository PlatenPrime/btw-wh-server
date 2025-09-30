import { sendMessageToDefsChat } from "../../../../utils/telegram/sendMessageToDefsChat.js";
export const sendDefCalculationStartNotification = async () => {
    try {
        await sendMessageToDefsChat("🔄 <b>Початок розрахунку дефіцитів</b>\n\nРозрахунок дефіцитів запущено...");
    }
    catch (error) {
        console.error("Failed to send start notification to Defs Chat:", error);
        // Не викидаємо помилку, щоб не переривати основний процес
    }
};
