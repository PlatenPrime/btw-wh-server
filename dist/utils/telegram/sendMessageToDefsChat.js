import { getBtwDefsChatId } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";
export const sendMessageToDefsChat = async (message) => {
    await sendMessageToTGChat({ message, chatId: getBtwDefsChatId() });
};
