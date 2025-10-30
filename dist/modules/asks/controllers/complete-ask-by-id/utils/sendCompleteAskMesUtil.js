import { sendMessageToTGUser } from "../../../../../utils/telegram/sendMessageToTGUser.js";
export const sendCompleteAskMesUtil = async ({ message, telegramChatId, }) => {
    try {
        await sendMessageToTGUser(message, telegramChatId);
    }
    catch (error) {
        console.error("Failed to send Telegram notification:", error);
    }
};
