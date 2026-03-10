import { RoleType } from "../../../../../constants/roles.js";
import { sendMessageToKasaChat } from "../../../../../utils/telegram/sendMessageToKasaChat.js";

/**
 * Отправка в чат кассы (@kassabtw); PRIME и test — без отправки.
 * role берётся из JWT (req.user), без запроса User в БД.
 */
export const sendCreateKaskMesUtil = async ({
  message,
  role,
}: {
  message: string;
  role?: string;
}) => {
  if (role === RoleType.PRIME || process.env.NODE_ENV === "test") {
    return;
  }
  try {
    await sendMessageToKasaChat(message);
  } catch (error) {
    console.error("Failed to send Telegram notification (kask):", error);
  }
};
