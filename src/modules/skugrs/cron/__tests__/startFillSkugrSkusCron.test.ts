import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../../models/Skugr.js", () => ({
  Skugr: {
    find: vi.fn(),
  },
}));
vi.mock("../../utils/fillSkugrSkusFromBrowserUtil.js", () => ({
  fillSkugrSkusFromBrowserUtil: vi.fn(),
}));
vi.mock("../../../browser/utils/browserRequest.js", () => ({
  summarizeBrowserError: vi.fn((error: unknown) => error),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
  sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatFillSkugrSkusReport.js", () => ({
  formatFillSkugrSkusReport: vi.fn(() => "skugr report"),
}));
vi.mock("../../../../utils/delay.js", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../config/isServerSkugrFillDisabled.js", () => ({
  isServerSkugrFillDisabled: vi.fn(() => false),
}));

import { Skugr } from "../../models/Skugr.js";
import { fillSkugrSkusFromBrowserUtil } from "../../utils/fillSkugrSkusFromBrowserUtil.js";
import { startFillSkugrSkusCron } from "../startFillSkugrSkusCron.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { delay } from "../../../../utils/delay.js";
import { isServerSkugrFillDisabled } from "../../config/isServerSkugrFillDisabled.js";
import {
  BrowserOriginBlockedError,
} from "../../../browser/utils/browserOriginBlockedError.js";

describe("startFillSkugrSkusCron", () => {
  let cronCallback: (() => Promise<void>) | null = null;
  const mockedCronJob = vi.mocked(CronJob);
  const mockCronInstance = { start: vi.fn(), stop: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    cronCallback = null;

    mockedCronJob.mockImplementation((...args: unknown[]) => {
      const callbackArg = args[1];
      if (typeof callbackArg === "function") {
        cronCallback = callbackArg as () => Promise<void>;
      }
      return mockCronInstance as never;
    });

    const exec = vi.fn().mockResolvedValue([]);
    const lean = vi.fn().mockReturnValue({ exec });
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(Skugr.find).mockReturnValue({ select } as never);
    vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    vi.mocked(isServerSkugrFillDisabled).mockImplementation(() => false);
  });

  it("creates CronJob with expected schedule and timezone", () => {
    startFillSkugrSkusCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 22 * * 0",
      expect.any(Function),
      null,
      true,
      "Europe/Kyiv"
    );
  });

  it("continues processing when one group fails", async () => {
    const groups = [
      { _id: { toString: () => "g1" }, konkName: "balun" },
      { _id: { toString: () => "g2" }, konkName: "balun" },
      { _id: { toString: () => "g3" }, konkName: "balun" },
    ];
    const exec = vi.fn().mockResolvedValue(groups);
    const lean = vi.fn().mockReturnValue({ exec });
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(Skugr.find).mockReturnValue({ select } as never);

    vi.mocked(fillSkugrSkusFromBrowserUtil)
      .mockResolvedValueOnce({
        skugr: {} as never,
        stats: { created: 1, linkedExisting: 0, skippedProductIdConflict: 0 } as never,
      })
      .mockRejectedValueOnce(new Error("network failed"))
      .mockResolvedValueOnce({
        skugr: {} as never,
        stats: { created: 2, linkedExisting: 1, skippedProductIdConflict: 0 } as never,
      });

    startFillSkugrSkusCron();
    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenCalledTimes(3);
    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenNthCalledWith(1, "g1");
    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenNthCalledWith(2, "g2");
    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenNthCalledWith(3, "g3");
    expect(sendCronAnalyticsReport).toHaveBeenCalledWith("skugr report");
    expect(delay).not.toHaveBeenCalled();
  });

  it("delays between air groups and skips remaining air after origin block", async () => {
    const groups = [
      { _id: { toString: () => "g1" }, konkName: "air" },
      { _id: { toString: () => "g2" }, konkName: "air" },
      { _id: { toString: () => "g3" }, konkName: "balun" },
    ];
    const exec = vi.fn().mockResolvedValue(groups);
    const lean = vi.fn().mockReturnValue({ exec });
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(Skugr.find).mockReturnValue({ select } as never);

    vi.mocked(fillSkugrSkusFromBrowserUtil)
      .mockResolvedValueOnce({
        skugr: {} as never,
        stats: { created: 1 } as never,
      })
      .mockRejectedValueOnce(
        new BrowserOriginBlockedError("blocked", {
          httpStatus: 520,
          retryAfterSec: 60,
        })
      )
      .mockResolvedValueOnce({
        skugr: {} as never,
        stats: { created: 2 } as never,
      });

    startFillSkugrSkusCron();
    if (cronCallback) {
      await cronCallback();
    }

    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenCalledTimes(3);
    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenNthCalledWith(3, "g3");
    expect(delay).toHaveBeenCalled();
  });

  it("skips air groups when server fill is disabled and still fills others", async () => {
    vi.mocked(isServerSkugrFillDisabled).mockImplementation(
      (konkName: string) => konkName.trim().toLowerCase() === "air"
    );

    const groups = [
      { _id: { toString: () => "g1" }, konkName: "air" },
      { _id: { toString: () => "g2" }, konkName: "AIR" },
      { _id: { toString: () => "g3" }, konkName: "balun" },
    ];
    const exec = vi.fn().mockResolvedValue(groups);
    const lean = vi.fn().mockReturnValue({ exec });
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(Skugr.find).mockReturnValue({ select } as never);

    vi.mocked(fillSkugrSkusFromBrowserUtil).mockResolvedValue({
      skugr: {} as never,
      stats: { created: 2 } as never,
    });

    startFillSkugrSkusCron();
    if (cronCallback) {
      await cronCallback();
    }

    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenCalledTimes(1);
    expect(fillSkugrSkusFromBrowserUtil).toHaveBeenCalledWith("g3");
    expect(sendCronAnalyticsReport).toHaveBeenCalledWith("skugr report");
  });
});
