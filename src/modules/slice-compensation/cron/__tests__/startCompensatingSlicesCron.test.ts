import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../../../utils/sliceDate.js", () => ({
  toSliceDate: vi.fn((d: Date) => d),
}));
vi.mock("../../utils/runCompensatingSkuSlices.js", () => ({
  runCompensatingSkuSlices: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
  sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatCompensatingSlicesReport.js", () => ({
  formatCompensatingSlicesReport: vi.fn(() => "compensating report"),
}));

import { runCompensatingSkuSlices } from "../../utils/runCompensatingSkuSlices.js";
import { startCompensatingSlicesCron } from "../startCompensatingSlicesCron.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";

describe("startCompensatingSlicesCron", () => {
  let cronCallback: (() => Promise<void>) | null = null;
  const mockedCronJob = vi.mocked(CronJob);
  const mockCronInstance = { start: vi.fn(), stop: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    cronCallback = null;
    mockedCronJob.mockImplementation(function (...args: unknown[]) {
      const cb = args[1];
      if (typeof cb === "function") {
        cronCallback = cb as () => Promise<void>;
      }
      return mockCronInstance as never;
    });
    vi.mocked(runCompensatingSkuSlices).mockResolvedValue({
      refetched: 2,
      updated: 1,
    });
    vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
  });

  it("creates CronJob at 10:30 Kiev", () => {
    startCompensatingSlicesCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 30 10 * * *",
      expect.any(Function),
      null,
      true,
      "Europe/Kiev",
    );
  });

  it("runs sku compensation on tick", async () => {
    startCompensatingSlicesCron();
    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(runCompensatingSkuSlices).toHaveBeenCalledTimes(1);
    const skuDate = vi.mocked(runCompensatingSkuSlices).mock.calls[0]![0];
    expect(skuDate).toBeInstanceOf(Date);
    expect(sendCronAnalyticsReport).toHaveBeenCalledWith("compensating report");
  });
});
