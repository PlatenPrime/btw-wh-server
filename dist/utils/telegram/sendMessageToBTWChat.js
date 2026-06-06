import { getBtwChatId } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";
export const sendMessageToBTWChat = async (message) => {
    await sendMessageToTGChat({ message, chatId: getBtwChatId() });
};
