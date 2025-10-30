import { RoleType } from "../../../../../constants/roles.js";
import { sendMessageToBTWChat } from "../../../../../utils/telegram/sendMessageToBTWChat.js";
export const sendCreateAskCreateMesUtil = async ({ message, askerData, }) => {
    if (askerData.role !== RoleType.PRIME && process.env.NODE_ENV !== "test") {
        try {
            await sendMessageToBTWChat(message);
        }
        catch (error) {
            console.error("Failed to send Telegram notification:", error);
        }
    }
};
