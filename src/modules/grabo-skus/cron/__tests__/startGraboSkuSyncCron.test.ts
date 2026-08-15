import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../../utils/runGraboSkuSyncUtil.js", () => ({
  runGraboSkuSyncUtil: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
  sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatGraboSkuSyncReport.js", () => ({
  formatGraboSkuSyncReport: vi.fn(() => "grabo report"),
}));
vi.mock("../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import {
  clearGraboSkuSyncForTests,
  tryAcquireGraboSkuSync,
} from "../../utils/graboSkuSyncLock.js";
import { runGraboSkuSyncUtil } from "../../utils/runGraboSkuSyncUtil.js";
import {
  GRABO_SKU_SYNC_CRON_EXPR,
  GRABO_SKU_SYNC_CRON_TZ,
  startGraboSkuSyncCron,
} from "../startGraboSkuSyncCron.js";

describe("startGraboSkuSyncCron", () => {
  let cronCallback: (() => Promise<void>) | null = null;
  const mockedCronJob = vi.mocked(CronJob);
  const mockCronInstance = { start: vi.fn(), stop: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    clearGraboSkuSyncForTests();
    cronCallback = null;
    mockedCronJob.mockImplementation((...args: unknown[]) => {
      const cb = args[1];
      if (typeof cb === "function") {
        cronCallback = cb as () => Promise<void>;
      }
      return mockCronInstance as never;
    });
    vi.mocked(runGraboSkuSyncUtil).mockResolvedValue({
      categoryCount: 1,
      listed: 2,
      created: 1,
      updated: 0,
      skippedNoProductId: 0,
      errors: 0,
      markedOffSite: 0,
      catalogComplete: true,
    });
    vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
  });

  it("creates CronJob Saturday 04:00 Kyiv", () => {
    startGraboSkuSyncCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      GRABO_SKU_SYNC_CRON_EXPR,
      expect.any(Function),
      null,
      true,
      GRABO_SKU_SYNC_CRON_TZ
    );
    expect(GRABO_SKU_SYNC_CRON_EXPR).toBe("0 0 4 * * 6");
    expect(GRABO_SKU_SYNC_CRON_TZ).toBe("Europe/Kyiv");
  });

  it("runs sync and sends report", async () => {
    startGraboSkuSyncCron();
    expect(cronCallback).toBeDefined();
    await cronCallback?.();

    expect(runGraboSkuSyncUtil).toHaveBeenCalledTimes(1);
    expect(sendCronAnalyticsReport).toHaveBeenCalledWith("grabo report");
  });

  it("skips tick when lock is held", async () => {
    tryAcquireGraboSkuSync();
    startGraboSkuSyncCron();
    await cronCallback?.();

    expect(runGraboSkuSyncUtil).not.toHaveBeenCalled();
  });

  it("sends error report and releases lock when runner throws", async () => {
    vi.mocked(runGraboSkuSyncUtil).mockRejectedValue(new Error("cron boom"));
    startGraboSkuSyncCron();
    await cronCallback?.();

    expect(sendCronAnalyticsReport).toHaveBeenCalled();
    expect(tryAcquireGraboSkuSync()).toBe(true);
  });
});
