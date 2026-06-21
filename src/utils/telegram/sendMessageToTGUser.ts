import axios, { AxiosResponse } from "axios";
import { getBtwToken } from "../../constants/telegram.js";
import { TelegramMessageResponse } from "./types.js";
import { logModuleDebug, logModuleError } from "../../logging/logModuleError.js";

export const sendMessageToTGUser = async (
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
      `https://api.telegram.org/bot${getBtwToken()}/sendMessage`,
      {
        chat_id: userId,
        text: message,
        parse_mode: "HTML",
      }
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data}`);
    }

    logModuleDebug("telegram", "message sent to user", {
      userId,
      messageId: response.data.result.message_id,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logModuleError("telegram", error, "Error sending message to user:");
    throw new Error(`Failed to send message to user: ${errorMessage}`);
  }
};
