import { BTW_DEFS_CHAT_ID } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";
export const sendMessageToDefsChat = async (message) => {
    await sendMessageToTGChat({ message, chatId: BTW_DEFS_CHAT_ID });
};
