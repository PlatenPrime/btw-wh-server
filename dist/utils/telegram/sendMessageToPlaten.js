import { getBtwPlatenId } from "../../constants/telegram.js";
import { sendMessageToTGUser } from "./sendMessageToTGUser.js";
export const sendMessageToPlaten = async (message) => {
    await sendMessageToTGUser(message, getBtwPlatenId());
};
