import axios from "axios";
import { BTW_TOKEN } from "../../constants/telegram.js";
export const sendMessageToTGChat = async ({ message, chatId, }) => {
    if (!message?.trim()) {
        throw new Error("Message cannot be empty");
    }
    if (!chatId?.trim()) {
        throw new Error("Chat ID cannot be empty");
    }
    try {
        const response = await axios.post(`https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: message,
        });
        if (!response.data.ok) {
            throw new Error(`Telegram API error: ${response.data}`);
        }
        console.log("Message sent to chat:", response.data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error sending message to chat:", errorMessage);
        throw new Error(`Failed to send message to chat: ${errorMessage}`);
    }
};
