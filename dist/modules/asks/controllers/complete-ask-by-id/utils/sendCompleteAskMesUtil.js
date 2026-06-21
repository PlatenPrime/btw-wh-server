import { sendMessageToTGUser } from "../../../../../utils/telegram/sendMessageToTGUser.js";
import { logModuleError } from "../../../../../logging/logModuleError.js";
export const sendCompleteAskMesUtil = async ({ message, telegramChatId, }) => {
    try {
        await sendMessageToTGUser(message, telegramChatId);
    }
    catch (error) {
        logModuleError("asks", error, "Failed to send Telegram notification:");
    }
};
