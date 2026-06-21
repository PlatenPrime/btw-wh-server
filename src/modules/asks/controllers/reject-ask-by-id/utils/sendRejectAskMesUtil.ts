import { sendMessageToTGUser } from "../../../../../utils/telegram/sendMessageToTGUser.js";
import { logModuleError } from "../../../../../logging/logModuleError.js";

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
    logModuleError("asks", error, "Failed to send Telegram notification:");
  }
};

