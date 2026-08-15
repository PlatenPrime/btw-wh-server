import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../../utils/runDeficitTelegramReportUtil.js", () => ({
  runDeficitTelegramReportUtil: vi.fn(),
}));

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("../../../../logging/createLogger.js", () => ({
  createLogger: () => mockLogger,
}));

import { runDeficitTelegramReportUtil } from "../../utils/runDeficitTelegramReportUtil.js";
import {
  clearDeficitReportLockForTests,
  tryAcquireDeficitReport,
} from "../../utils/deficitReportLock.js";
import {
  DEFICIT_REPORT_CRON_EXPR,
  DEFICIT_REPORT_CRON_TZ,
  startDeficitReportCron,
} from "../startDeficitReportCron.js";

describe("startDeficitReportCron", () => {
  let cronCallback: (() => Promise<void>) | null = null;
  const mockedCronJob = vi.mocked(CronJob);
  const mockCronInstance = { start: vi.fn(), stop: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    clearDeficitReportLockForTests();
    cronCallback = null;
    mockedCronJob.mockImplementation((...args: unknown[]) => {
      const cb = args[1];
      if (typeof cb === "function") {
        cronCallback = cb as () => Promise<void>;
      }
      return mockCronInstance as never;
    });
    vi.mocked(runDeficitTelegramReportUtil).mockResolvedValue({
      result: {},
      total: 3,
      totalCriticalDefs: 1,
      totalLimitDefs: 2,
      calculatedAt: new Date("2026-08-15T09:20:00.000Z"),
    });
  });

  it("creates CronJob weekdays 09:20-17:20 Kyiv", () => {
    startDeficitReportCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      DEFICIT_REPORT_CRON_EXPR,
      expect.any(Function),
      null,
      true,
      DEFICIT_REPORT_CRON_TZ
    );
    expect(DEFICIT_REPORT_CRON_EXPR).toBe("0 20 9-17 * * 1-5");
    expect(DEFICIT_REPORT_CRON_TZ).toBe("Europe/Kyiv");
    expect(mockLogger.info).toHaveBeenCalledWith(
      {
        schedule: DEFICIT_REPORT_CRON_EXPR,
        timezone: DEFICIT_REPORT_CRON_TZ,
      },
      "cron started"
    );
  });

  it("runs report util on cron tick", async () => {
    startDeficitReportCron();
    expect(cronCallback).toBeDefined();
    await cronCallback?.();

    expect(runDeficitTelegramReportUtil).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      { total: 3 },
      "deficit report completed"
    );
  });

  it("skips tick when lock is held", async () => {
    tryAcquireDeficitReport();
    startDeficitReportCron();
    await cronCallback?.();

    expect(runDeficitTelegramReportUtil).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "deficit report already running, skip cron tick"
    );
  });

  it("logs error and releases lock when runner throws", async () => {
    vi.mocked(runDeficitTelegramReportUtil).mockRejectedValue(
      new Error("cron boom")
    );
    startDeficitReportCron();
    await cronCallback?.();

    expect(mockLogger.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      "deficit report cron failed"
    );
    expect(tryAcquireDeficitReport()).toBe(true);
  });
});
