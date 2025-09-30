import axios from "axios";
import { BTW_TOKEN } from "../../constants/telegram.js";
export const sendMessageToTGUser = async (message, userId) => {
    if (!message?.trim()) {
        throw new Error("Message cannot be empty");
    }
    if (!userId?.trim()) {
        throw new Error("User ID cannot be empty");
    }
    try {
        const response = await axios.post(`https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`, {
            chat_id: userId,
            text: message,
            parse_mode: "HTML",
        });
        if (!response.data.ok) {
            throw new Error(`Telegram API error: ${response.data}`);
        }
        console.log("Message sent to user:", response.data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error sending message to user:", errorMessage);
        throw new Error(`Failed to send message to user: ${errorMessage}`);
    }
};
