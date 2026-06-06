import { getBtwPlatenId } from "../../constants/telegram.js";
import { sendMessageToTGUser } from "./sendMessageToTGUser.js";

export const sendMessageToPlaten = async (message: string): Promise<void> => {
  await sendMessageToTGUser(message, getBtwPlatenId());
};