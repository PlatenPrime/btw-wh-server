import { RoleType } from "../../../../../constants/roles.js";
import { sendMessageToBTWChat } from "../../../../../utils/telegram/sendMessageToBTWChat.js";
import { logModuleError } from "../../../../../logging/logModuleError.js";
export const sendCreateAskMesUtil = async ({ message, askerData, }) => {
    if (askerData.role === RoleType.USER && process.env.NODE_ENV !== "test") {
        try {
            await sendMessageToBTWChat(message);
        }
        catch (error) {
            logModuleError("asks", error, "Failed to send Telegram notification:");
        }
    }
};
