import { getBtwAnalyticsChatId } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";

export const sendMessageToAnalyticsChat = async (
  message: string
): Promise<void> => {
  await sendMessageToTGChat({ message, chatId: getBtwAnalyticsChatId() });
};
