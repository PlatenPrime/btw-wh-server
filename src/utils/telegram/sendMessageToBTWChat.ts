import { getBtwChatId } from "../../constants/telegram.js";
import { sendMessageToTGChat } from "./sendMessageToTGChat.js";

export const sendMessageToBTWChat = async (message: string): Promise<void> => {
  await sendMessageToTGChat({ message, chatId: getBtwChatId() });
};
