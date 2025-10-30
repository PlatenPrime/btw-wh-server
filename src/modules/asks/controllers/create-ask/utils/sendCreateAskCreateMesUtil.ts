import { RoleType } from "../../../../../constants/roles.js";
import { sendMessageToBTWChat } from "../../../../../utils/telegram/sendMessageToBTWChat.js";
import { IUser } from "../../../../auth/models/User.js";

export const sendCreateAskCreateMesUtil = async ({
  message,
  askerData,
}: {
  message: string;
  askerData: IUser;
}) => {
  if (askerData.role !== RoleType.PRIME && process.env.NODE_ENV !== "test") {
    try {
      await sendMessageToBTWChat(message);
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  }
};
