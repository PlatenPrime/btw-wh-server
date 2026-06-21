import axios from "axios";
import { getBtwToken } from "../../constants/telegram.js";
import { logModuleDebug, logModuleError } from "../../logging/logModuleError.js";
export const sendMessageToTGChat = async ({ message, chatId, }) => {
    if (!message?.trim()) {
        throw new Error("Message cannot be empty");
    }
    if (!chatId?.trim()) {
        throw new Error("Chat ID cannot be empty");
    }
    try {
        const response = await axios.post(`https://api.telegram.org/bot${getBtwToken()}/sendMessage`, {
            chat_id: chatId,
            text: message,
        });
        if (!response.data.ok) {
            throw new Error(`Telegram API error: ${response.data}`);
        }
        logModuleDebug("telegram", "message sent to chat", {
            chatId,
            messageId: response.data.result.message_id,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        logModuleError("telegram", error, "Error sending message to chat:");
        throw new Error(`Failed to send message to chat: ${errorMessage}`);
    }
};
