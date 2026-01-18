import { CronJob } from "cron";
import fs from "fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock cron
vi.mock("cron");
const mockedCronJob = vi.mocked(CronJob);

// Mock fs
vi.mock("fs/promises");
const mockedFs = vi.mocked(fs);

// Mock exportCollectionsToJson
vi.mock("../utils/exportCollectionsToJson.js", () => ({
  exportCollectionsToJson: vi.fn(),
}));

// Mock telegram functions
vi.mock("../../utils/telegram/sendFileToTGUser.js", () => ({
  sendFileToTGUser: vi.fn(),
}));

vi.mock("../../utils/telegram/sendMessageToPlaten.js", () => ({
  sendMessageToPlaten: vi.fn(),
}));

// Mock constants
vi.mock("../../constants/telegram.js", () => ({
  BTW_PLATEN_ID: "555196992",
}));

// Import after mocking
import { sendFileToTGUser } from "../../utils/telegram/sendFileToTGUser.js";
import { sendMessageToPlaten } from "../../utils/telegram/sendMessageToPlaten.js";
import { startCollectionsBackupCron } from "../startCollectionsBackupCron.js";
import { exportCollectionsToJson } from "../utils/exportCollectionsToJson.js";

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, "log"),
  error: vi.spyOn(console, "error"),
  warn: vi.spyOn(console, "warn"),
};

describe("startCollectionsBackupCron", () => {
  let mockCronJobInstance: any;
  let cronCallback: (() => Promise<void>) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();

    // Создаем mock экземпляр CronJob
    mockCronJobInstance = {
      start: vi.fn(),
      stop: vi.fn(),
    };

    // Мокируем конструктор CronJob
    mockedCronJob.mockImplementation((...args: any[]) => {
      // Первый аргумент - cron pattern
      // Второй аргумент - callback функция
      if (args[1] && typeof args[1] === "function") {
        cronCallback = args[1];
      }
      return mockCronJobInstance as any;
    });
  });

  it("должен создать CronJob с правильным расписанием и таймзоной", () => {
    const job = startCollectionsBackupCron();

    // Проверяем что CronJob был создан
    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 6 * * *", // расписание
      expect.any(Function), // callback
      null, // onComplete
      true, // start
      "Europe/Kiev" // timezone
    );

    expect(job).toBe(mockCronJobInstance);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "[CRON Backup] Started: daily at 06:00 (Kiev time)"
    );
  });

  it("должен успешно выполнить бэкап и отправить файл", async () => {
    const mockFilePath = "/path/to/backup.json";

    (exportCollectionsToJson as any).mockResolvedValue(mockFilePath);
    (sendFileToTGUser as any).mockResolvedValue(undefined);
    mockedFs.unlink.mockResolvedValue(undefined);

    startCollectionsBackupCron();

    // Вызываем callback функцию
    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    // Проверяем последовательность вызовов
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "[CRON Backup] Starting collections backup..."
    );
    expect(exportCollectionsToJson).toHaveBeenCalled();
    expect(sendFileToTGUser).toHaveBeenCalledWith(
      mockFilePath,
      "555196992"
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "[CRON Backup] Backup completed and sent successfully"
    );
    expect(mockedFs.unlink).toHaveBeenCalledWith(mockFilePath);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      `[CRON Backup] Temporary file deleted: ${mockFilePath}`
    );
  });

  it("должен обработать ошибку при экспорте и отправить уведомление", async () => {
    const exportError = new Error("Export failed");

    (exportCollectionsToJson as any).mockRejectedValue(exportError);
    (sendMessageToPlaten as any).mockResolvedValue(undefined);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(exportCollectionsToJson).toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[CRON Backup] Error:",
      "Export failed"
    );
    expect(sendMessageToPlaten).toHaveBeenCalledWith(
      "❌ Помилка під час створення бэкапу колекцій:\nExport failed"
    );
    expect(sendFileToTGUser).not.toHaveBeenCalled();
  });

  it("должен обработать ошибку при отправке файла", async () => {
    const mockFilePath = "/path/to/backup.json";
    const sendError = new Error("Send failed");

    (exportCollectionsToJson as any).mockResolvedValue(mockFilePath);
    (sendFileToTGUser as any).mockRejectedValue(sendError);
    (sendMessageToPlaten as any).mockResolvedValue(undefined);
    mockedFs.unlink.mockResolvedValue(undefined);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(exportCollectionsToJson).toHaveBeenCalled();
    expect(sendFileToTGUser).toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[CRON Backup] Error:",
      "Send failed"
    );
    expect(sendMessageToPlaten).toHaveBeenCalledWith(
      "❌ Помилка під час створення бэкапу колекцій:\nSend failed"
    );
    // Файл должен быть удален при ошибке
    expect(mockedFs.unlink).toHaveBeenCalledWith(mockFilePath);
  });

  it("должен удалить файл при ошибке если он был создан", async () => {
    const mockFilePath = "/path/to/backup.json";
    const sendError = new Error("Send failed");

    (exportCollectionsToJson as any).mockResolvedValue(mockFilePath);
    (sendFileToTGUser as any).mockRejectedValue(sendError);
    (sendMessageToPlaten as any).mockResolvedValue(undefined);
    mockedFs.unlink.mockResolvedValue(undefined);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    // Файл должен быть удален даже при ошибке отправки
    expect(mockedFs.unlink).toHaveBeenCalledWith(mockFilePath);
  });

  it("должен обработать ошибку удаления файла после успешной отправки", async () => {
    const mockFilePath = "/path/to/backup.json";
    const deleteError = new Error("Delete failed");

    (exportCollectionsToJson as any).mockResolvedValue(mockFilePath);
    (sendFileToTGUser as any).mockResolvedValue(undefined);
    mockedFs.unlink.mockRejectedValue(deleteError);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(mockedFs.unlink).toHaveBeenCalledWith(mockFilePath);
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      `[CRON Backup] Failed to delete temporary file: ${mockFilePath}`,
      deleteError
    );
  });

  it("должен обработать ошибку отправки уведомления об ошибке", async () => {
    const exportError = new Error("Export failed");
    const notificationError = new Error("Notification failed");

    (exportCollectionsToJson as any).mockRejectedValue(exportError);
    (sendMessageToPlaten as any).mockRejectedValue(notificationError);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[CRON Backup] Error:",
      "Export failed"
    );
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[CRON Backup] Failed to send error notification:",
      notificationError
    );
  });
});