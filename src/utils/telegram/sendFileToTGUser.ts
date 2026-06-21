import axios, { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import { getBtwToken } from "../../constants/telegram.js";
import { TelegramDocumentResponse } from "./types.js";
import { logModuleDebug, logModuleError } from "../../logging/logModuleError.js";

export const sendFileToTGUser = async (
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
      `https://api.telegram.org/bot${getBtwToken()}/sendDocument`,
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

    logModuleDebug("telegram", "file sent to user", {
      userId,
      filePath,
      messageId: response.data.result.message_id,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logModuleError("telegram", error, "Помилка відправки файла користувачу:");
    throw new Error(`Не вдалося відправити файл користувачу: ${errorMessage}`);
  }
};
