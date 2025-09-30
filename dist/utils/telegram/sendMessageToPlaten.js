import { sendMessageToTGUser } from "./sendMessageToTGUser.js";
import { BTW_PLATEN_ID } from "../../constants/telegram.js";
export const sendMessageToPlaten = async (message) => {
    await sendMessageToTGUser(message, BTW_PLATEN_ID);
};
