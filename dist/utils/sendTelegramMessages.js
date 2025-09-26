import axios from "axios";
import FormData from "form-data";
import fs from "fs";
// Telegram Bot Token (split for security)
const one = "6777916786:";
const two = "AAG1HB5d9spnsql";
const three = "YM3zIV8C5SFa4JA7GV-E";
const TOKEN = one + two + three;
// Chat and User IDs
const CHAT_ID = "-1002121224059";
const PLATEN_ID = "555196992";
/**
 * Sends a message to the default Telegram chat
 * @param message - The message text to send
 * @throws Error if message sending fails
 */
export const sendMessageToTelegram = async (message) => {
    if (!message?.trim()) {
        throw new Error("Message cannot be empty");
    }
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
        });
        if (!response.data.ok) {
            throw new Error(`Telegram API error: ${response.data}`);
        }
        console.log("Message sent:", response.data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error sending message:", errorMessage);
        throw new Error(`Failed to send message: ${errorMessage}`);
    }
};
/**
 * Sends a message to a specific Telegram chat
 * @param message - The message text to send
 * @param chatId - The chat ID to send the message to
 * @throws Error if message sending fails
 */
export const sendMessageToChat = async (message, chatId) => {
    if (!message?.trim()) {
        throw new Error("Message cannot be empty");
    }
    if (!chatId?.trim()) {
        throw new Error("Chat ID cannot be empty");
    }
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
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
/**
 * Sends an HTML-formatted message to a specific user
 * @param message - The HTML message to send
 * @param userId - The user ID to send the message to
 * @throws Error if message sending fails
 */
export const sendMessageToUser = async (message, userId) => {
    if (!message?.trim()) {
        throw new Error("Message cannot be empty");
    }
    if (!userId?.trim()) {
        throw new Error("User ID cannot be empty");
    }
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
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
/**
 * Sends a message to the Platen user
 * @param message - The HTML message to send
 * @throws Error if message sending fails
 */
export const sendMessageToPlaten = async (message) => {
    return sendMessageToUser(message, PLATEN_ID);
};
/**
 * Sends a file to a specific user
 * @param filePath - Path to the file to send
 * @param userId - The user ID to send the file to
 * @throws Error if file sending fails
 */
export const sendFileToUser = async (filePath, userId) => {
    if (!filePath?.trim()) {
        throw new Error("File path cannot be empty");
    }
    if (!userId?.trim()) {
        throw new Error("User ID cannot be empty");
    }
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }
    try {
        const formData = new FormData();
        formData.append("chat_id", userId);
        formData.append("document", fs.createReadStream(filePath));
        const response = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendDocument`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        if (!response.data.ok) {
            throw new Error(`Telegram API error: ${response.data}`);
        }
        console.log("Файл успешно отправлен пользователю:", response.data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Ошибка отправки файла пользователю:", errorMessage);
        throw new Error(`Failed to send file to user: ${errorMessage}`);
    }
};
/**
 * Sends a file to the Platen user
 * @param filePath - Path to the file to send
 * @throws Error if file sending fails
 */
export const sendFileToPlaten = async (filePath) => {
    return sendFileToUser(filePath, PLATEN_ID);
};
