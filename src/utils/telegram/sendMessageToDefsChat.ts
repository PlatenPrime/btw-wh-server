import { BTW_DEFS_CHAT_ID } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";

export const sendMessageToDefsChat = async (message: string): Promise<void> => {
  await sendMessageToTGChat({ message, chatId: BTW_DEFS_CHAT_ID });
};
