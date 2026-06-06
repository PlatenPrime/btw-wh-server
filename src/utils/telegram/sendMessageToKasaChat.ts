import { getKasaChatId } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";

export const sendMessageToKasaChat = async (
  message: string
): Promise<void> => {
  await sendMessageToTGChat({ message, chatId: getKasaChatId() });
};
