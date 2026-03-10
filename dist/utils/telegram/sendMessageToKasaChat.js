import { KASA_CHAT_ID } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";
export const sendMessageToKasaChat = async (message) => {
    await sendMessageToTGChat({ message, chatId: KASA_CHAT_ID });
};
