import axios, { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";

import { BTW_TOKEN, BTW_CHAT_ID, BTW_PLATEN_ID } from "../constants/telegram.js";

// Types
interface TelegramMessageResponse {
  ok: boolean;
  result: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
    };
    chat: {
      id: number;
      title?: string;
      type: string;
    };
    date: number;
    text: string;
  };
}

interface TelegramDocumentResponse {
  ok: boolean;
  result: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    document: {
      file_name: string;
      mime_type: string;
      file_id: string;
      file_unique_id: string;
      file_size: number;
    };
  };
}

interface TelegramError {
  ok: false;
  error_code: number;
  description: string;
}

/**
 * Sends a message to the BTW Chat
 * @param message - The message text to send
 * @throws Error if message sending fails
 */
export const sendMessageToBTWChat = async (message: string): Promise<void> => {
  if (!message?.trim()) {
    throw new Error("Message cannot be empty");
  }

  try {
    const response: AxiosResponse<TelegramMessageResponse> = await axios.post(
      `https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`,
      {
        chat_id: BTW_CHAT_ID,
        text: message,
      }
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data}`);
    }

    console.log("Message sent:", response.data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
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
export const sendMessageToChat = async (
  message: string,
  chatId: string
): Promise<void> => {
  if (!message?.trim()) {
    throw new Error("Message cannot be empty");
  }
  if (!chatId?.trim()) {
    throw new Error("Chat ID cannot be empty");
  }

  try {
    const response: AxiosResponse<TelegramMessageResponse> = await axios.post(
      `https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
      }
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data}`);
    }

    console.log("Message sent to chat:", response.data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
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
export const sendMessageToUser = async (
  message: string,
  userId: string
): Promise<void> => {
  if (!message?.trim()) {
    throw new Error("Message cannot be empty");
  }
  if (!userId?.trim()) {
    throw new Error("User ID cannot be empty");
  }

  try {
    const response: AxiosResponse<TelegramMessageResponse> = await axios.post(
      `https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`,
      {
        chat_id: userId,
        text: message,
        parse_mode: "HTML",
      }
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data}`);
    }

    console.log("Message sent to user:", response.data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error sending message to user:", errorMessage);
    throw new Error(`Failed to send message to user: ${errorMessage}`);
  }
};

/**
 * Sends a message to the Platen user
 * @param message - The HTML message to send
 * @throws Error if message sending fails
 */
export const sendMessageToPlaten = async (message: string): Promise<void> => {
  return sendMessageToUser(message, BTW_PLATEN_ID);
};

/**
 * Sends a file to a specific user
 * @param filePath - Path to the file to send
 * @param userId - The user ID to send the file to
 * @throws Error if file sending fails
 */
export const sendFileToUser = async (
  filePath: string,
  userId: string
): Promise<void> => {
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

    const response: AxiosResponse<TelegramDocumentResponse> = await axios.post(
      `https://api.telegram.org/bot${BTW_TOKEN}/sendDocument`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data}`);
    }

    console.log("Файл успешно отправлен пользователю:", response.data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Ошибка отправки файла пользователю:", errorMessage);
    throw new Error(`Failed to send file to user: ${errorMessage}`);
  }
};

/**
 * Sends a file to the Platen user
 * @param filePath - Path to the file to send
 * @throws Error if file sending fails
 */
export const sendFileToPlaten = async (filePath: string): Promise<void> => {
  return sendFileToUser(filePath, BTW_PLATEN_ID);
};
