import { sendMessageToDefsChat } from "../../../../../../utils/telegram/sendMessageToDefsChat.js";
import { logModuleError } from "../../../../../../logging/logModuleError.js";
export const sendDefCalculationStartNotification = async () => {
    try {
        await sendMessageToDefsChat(`🔄 Розрахунок дефіцитів запущено...`);
    }
    catch (error) {
        logModuleError("defs", error, "Failed to send start notification to Defs Chat:");
        // Не викидаємо помилку, щоб не переривати основний процес
    }
};
