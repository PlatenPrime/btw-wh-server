import { sendMessageToTGUser } from "../../../../../utils/telegram/sendMessageToTGUser.js";

interface SendRejectAskMesUtilInput {
  message: string;
  telegramChatId: string;
}

export const sendRejectAskMesUtil = async ({
  message,
  telegramChatId,
}: SendRejectAskMesUtilInput) => {
  try {
    await sendMessageToTGUser(message, telegramChatId);
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
};

