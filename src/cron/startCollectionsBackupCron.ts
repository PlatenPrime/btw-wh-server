import { CronJob } from "cron";
import fs from "fs/promises";
import { createLogger } from "../logging/createLogger.js";
import { exportCollectionsToJson } from "./utils/exportCollectionsToJson.js";
import { sendFileToTGUser } from "../utils/telegram/sendFileToTGUser.js";
import { getBtwPlatenId } from "../constants/telegram.js";
import { sendMessageToPlaten } from "../utils/telegram/sendMessageToPlaten.js";

const log = createLogger({ module: "backup", job: "cron" });

/**
 * Запускает cron job для ежедневного бэкапа коллекций
 * Каждый день в 06:00 по киевскому времени
 */
export function startCollectionsBackupCron(): CronJob {
  const job = new CronJob(
    "0 0 6 * * *", // каждый день в 04:00
    async () => {
      let backupFilePath: string | null = null;
      try {
        log.info("starting collections backup");

        backupFilePath = await exportCollectionsToJson();

        await sendFileToTGUser(backupFilePath, getBtwPlatenId());

        log.info("backup completed and sent successfully");

        try {
          await fs.unlink(backupFilePath);
          log.info({ backupFilePath }, "temporary backup file deleted");
        } catch (deleteError) {
          log.warn(
            { err: deleteError, backupFilePath },
            "failed to delete temporary backup file"
          );
        }
      } catch (error) {
        log.error({ err: error }, "collections backup failed");

        try {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          await sendMessageToPlaten(
            `❌ Помилка під час створення бэкапу колекцій:\n${errorMessage}`
          );
        } catch (notificationError) {
          log.error(
            { err: notificationError },
            "failed to send backup error notification"
          );
        }

        if (backupFilePath) {
          try {
            await fs.unlink(backupFilePath);
          } catch {
            // Игнорируем ошибку удаления при ошибке бэкапа
          }
        }
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  log.info({ schedule: "0 0 6 * * *", timezone: "Europe/Kiev" }, "cron started");
  return job;
}
