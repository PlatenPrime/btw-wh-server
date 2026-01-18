import { CronJob } from "cron";
import fs from "fs/promises";
import { exportCollectionsToJson } from "./utils/exportCollectionsToJson.js";
import { sendFileToTGUser } from "../utils/telegram/sendFileToTGUser.js";
import { BTW_PLATEN_ID } from "../constants/telegram.js";
import { sendMessageToPlaten } from "../utils/telegram/sendMessageToPlaten.js";
/**
 * Запускает cron job для ежедневного бэкапа коллекций
 * Каждый день в 06:00 по киевскому времени
 */
export function startCollectionsBackupCron() {
    const job = new CronJob("0 0 6 * * *", // каждый день в 04:00
    async () => {
        let backupFilePath = null;
        try {
            console.log(`[CRON Backup] Starting collections backup...`);
            // Экспортируем коллекции в JSON файл
            backupFilePath = await exportCollectionsToJson();
            // Отправляем файл в телеграм
            await sendFileToTGUser(backupFilePath, BTW_PLATEN_ID);
            console.log(`[CRON Backup] Backup completed and sent successfully`);
            // Удаляем временный файл после успешной отправки
            try {
                await fs.unlink(backupFilePath);
                console.log(`[CRON Backup] Temporary file deleted: ${backupFilePath}`);
            }
            catch (deleteError) {
                console.warn(`[CRON Backup] Failed to delete temporary file: ${backupFilePath}`, deleteError);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error(`[CRON Backup] Error:`, errorMessage);
            // Отправляем уведомление об ошибке в телеграм
            try {
                await sendMessageToPlaten(`❌ Помилка під час створення бэкапу колекцій:\n${errorMessage}`);
            }
            catch (notificationError) {
                console.error(`[CRON Backup] Failed to send error notification:`, notificationError);
            }
            // Удаляем файл при ошибке, если он был создан
            if (backupFilePath) {
                try {
                    await fs.unlink(backupFilePath);
                }
                catch (deleteError) {
                    // Игнорируем ошибку удаления при ошибке бэкапа
                }
            }
        }
    }, null, true, "Europe/Kiev");
    console.log(`[CRON Backup] Started: daily at 06:00 (Kiev time)`);
    return job;
}
