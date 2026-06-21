import axios, { AxiosResponse } from "axios";
import { getBtwToken } from "../../constants/telegram.js";
import { TelegramMessageResponse } from "./types.js";
import { logModuleDebug, logModuleError } from "../../logging/logModuleError.js";

interface SendMessageToTGChatProps {
  message: string;
  chatId: string;
}

export const sendMessageToTGChat = async ({
  message,
  chatId,
}: SendMessageToTGChatProps): Promise<void> => {
  if (!message?.trim()) {
    throw new Error("Message cannot be empty");
  }
  if (!chatId?.trim()) {
    throw new Error("Chat ID cannot be empty");
  }

  try {
    const response: AxiosResponse<TelegramMessageResponse> = await axios.post(
      `https://api.telegram.org/bot${getBtwToken()}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
      }
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data}`);
    }

    logModuleDebug("telegram", "message sent to chat", {
      chatId,
      messageId: response.data.result.message_id,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logModuleError("telegram", error, "Error sending message to chat:");
    throw new Error(`Failed to send message to chat: ${errorMessage}`);
  }
};
