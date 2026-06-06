import { getBtwAnalyticsChatId } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";
export const sendMessageToAnalyticsChat = async (message) => {
    await sendMessageToTGChat({ message, chatId: getBtwAnalyticsChatId() });
};
