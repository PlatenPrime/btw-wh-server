import { sendMessageToTGUser } from "../../../../../utils/telegram/sendMessageToTGUser.js";
import { logModuleError } from "../../../../../logging/logModuleError.js";

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
    logModuleError("asks", error, "Failed to send Telegram notification:");
  }
};
