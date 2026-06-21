import { CronJob } from "cron";
import fs from "fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("cron");
vi.mock("../utils/exportCollectionsToJson.js", () => ({
  exportCollectionsToJson: vi.fn(),
}));
vi.mock("../../utils/telegram/sendFileToTGUser.js", () => ({
  sendFileToTGUser: vi.fn(),
}));
vi.mock("../../utils/telegram/sendMessageToPlaten.js", () => ({
  sendMessageToPlaten: vi.fn(),
}));
vi.mock("../../constants/telegram.js", () => ({
  getBtwPlatenId: () => "555196992",
}));
vi.mock("../../logging/createLogger.js", () => ({
  createLogger: () => mockLogger,
}));
vi.mock("fs/promises");

const mockedCronJob = vi.mocked(CronJob);
const mockedFs = vi.mocked(fs);

import { sendFileToTGUser } from "../../utils/telegram/sendFileToTGUser.js";
import { sendMessageToPlaten } from "../../utils/telegram/sendMessageToPlaten.js";
import { startCollectionsBackupCron } from "../startCollectionsBackupCron.js";
import { exportCollectionsToJson } from "../utils/exportCollectionsToJson.js";

describe("startCollectionsBackupCron", () => {
  let mockCronJobInstance: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };
  let cronCallback: (() => Promise<void>) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    cronCallback = null;

    mockCronJobInstance = {
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockedCronJob.mockImplementation((...args: unknown[]) => {
      if (args[1] && typeof args[1] === "function") {
        cronCallback = args[1] as () => Promise<void>;
      }
      return mockCronJobInstance as never;
    });
  });

  it("должен создать CronJob с правильным расписанием и таймзоной", () => {
    const job = startCollectionsBackupCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 6 * * *",
      expect.any(Function),
      null,
      true,
      "Europe/Kiev"
    );

    expect(job).toBe(mockCronJobInstance);
    expect(mockLogger.info).toHaveBeenCalledWith(
      { schedule: "0 0 6 * * *", timezone: "Europe/Kiev" },
      "cron started"
    );
  });

  it("должен успешно выполнить бэкап и отправить файл", async () => {
    const mockFilePath = "/path/to/backup.json";

    vi.mocked(exportCollectionsToJson).mockResolvedValue(mockFilePath);
    vi.mocked(sendFileToTGUser).mockResolvedValue(undefined);
    mockedFs.unlink.mockResolvedValue(undefined);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(mockLogger.info).toHaveBeenCalledWith("starting collections backup");
    expect(exportCollectionsToJson).toHaveBeenCalled();
    expect(sendFileToTGUser).toHaveBeenCalledWith(mockFilePath, "555196992");
    expect(mockLogger.info).toHaveBeenCalledWith(
      "backup completed and sent successfully"
    );
    expect(mockedFs.unlink).toHaveBeenCalledWith(mockFilePath);
    expect(mockLogger.info).toHaveBeenCalledWith(
      { backupFilePath: mockFilePath },
      "temporary backup file deleted"
    );
  });

  it("должен обработать ошибку при экспорте и отправить уведомление", async () => {
    const exportError = new Error("Export failed");

    vi.mocked(exportCollectionsToJson).mockRejectedValue(exportError);
    vi.mocked(sendMessageToPlaten).mockResolvedValue(undefined);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(mockLogger.error).toHaveBeenCalledWith(
      { err: exportError },
      "collections backup failed"
    );
    expect(sendMessageToPlaten).toHaveBeenCalledWith(
      "❌ Помилка під час створення бэкапу колекцій:\nExport failed"
    );
    expect(sendFileToTGUser).not.toHaveBeenCalled();
  });

  it("должен обработать ошибку при отправке файла", async () => {
    const mockFilePath = "/path/to/backup.json";
    const sendError = new Error("Send failed");

    vi.mocked(exportCollectionsToJson).mockResolvedValue(mockFilePath);
    vi.mocked(sendFileToTGUser).mockRejectedValue(sendError);
    vi.mocked(sendMessageToPlaten).mockResolvedValue(undefined);
    mockedFs.unlink.mockResolvedValue(undefined);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(mockLogger.error).toHaveBeenCalledWith(
      { err: sendError },
      "collections backup failed"
    );
    expect(sendMessageToPlaten).toHaveBeenCalledWith(
      "❌ Помилка під час створення бэкапу колекцій:\nSend failed"
    );
    expect(mockedFs.unlink).toHaveBeenCalledWith(mockFilePath);
  });

  it("должен обработать ошибку удаления файла после успешной отправки", async () => {
    const mockFilePath = "/path/to/backup.json";
    const deleteError = new Error("Delete failed");

    vi.mocked(exportCollectionsToJson).mockResolvedValue(mockFilePath);
    vi.mocked(sendFileToTGUser).mockResolvedValue(undefined);
    mockedFs.unlink.mockRejectedValue(deleteError);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(mockLogger.warn).toHaveBeenCalledWith(
      { err: deleteError, backupFilePath: mockFilePath },
      "failed to delete temporary backup file"
    );
  });

  it("должен обработать ошибку отправки уведомления об ошибке", async () => {
    const exportError = new Error("Export failed");
    const notificationError = new Error("Notification failed");

    vi.mocked(exportCollectionsToJson).mockRejectedValue(exportError);
    vi.mocked(sendMessageToPlaten).mockRejectedValue(notificationError);

    startCollectionsBackupCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(mockLogger.error).toHaveBeenCalledWith(
      { err: notificationError },
      "failed to send backup error notification"
    );
  });
});
