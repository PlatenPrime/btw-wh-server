import { sendMessageToTGUser } from "../../../../../utils/telegram/sendMessageToTGUser.js";

interface SendCompleteAskMesUtilInput {
  message: string;
  telegramChatId: string;
}

export const sendCompleteAskMesUtil = async ({
  message,
  telegramChatId,
}: SendCompleteAskMesUtilInput) => {
  try {
    await sendMessageToTGUser(message, telegramChatId);
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
};
