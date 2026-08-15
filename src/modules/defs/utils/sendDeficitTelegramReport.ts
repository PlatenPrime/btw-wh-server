import { DEFICIT_REPORT_CHUNK_DELAY_MS } from "../constants/deficitReportCron.js";
import { logModuleError } from "../../../logging/logModuleError.js";
import { sendMessageToDefsChat } from "../../../utils/telegram/sendMessageToDefsChat.js";

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Шлёт заранее отформатированные сообщения в чат дефицитов.
 * Ошибки Telegram логируются и не пробрасываются.
 */
export async function sendDeficitTelegramReport(
  messages: string[],
  delayMs: number = DEFICIT_REPORT_CHUNK_DELAY_MS
): Promise<void> {
  try {
    for (let i = 0; i < messages.length; i += 1) {
      await sendMessageToDefsChat(messages[i]);
      if (i < messages.length - 1) {
        await delay(delayMs);
      }
    }
  } catch (error) {
    logModuleError(
      "defs",
      error,
      "Failed to send deficit report to Defs Chat:"
    );
  }
}
