import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../../utils/runSkuInvalidFlagSync.js", () => ({
  runSkuInvalidFlagSync: vi.fn(),
}));

import { runSkuInvalidFlagSync } from "../../utils/runSkuInvalidFlagSync.js";
import { startSkuInvalidFlagCron } from "../startSkuInvalidFlagCron.js";

describe("startSkuInvalidFlagCron", () => {
  let cronCallback: (() => Promise<void>) | null = null;
  const mockedCronJob = vi.mocked(CronJob);
  const mockCronInstance = { start: vi.fn(), stop: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    cronCallback = null;
    mockedCronJob.mockImplementation((...args: unknown[]) => {
      const cb = args[1];
      if (typeof cb === "function") {
        cronCallback = cb as () => Promise<void>;
      }
      return mockCronInstance as never;
    });
    vi.mocked(runSkuInvalidFlagSync).mockResolvedValue({
      updated: 3,
      konkCount: 1,
    });
  });

  it("schedules weekly Monday 03:00 Kyiv", () => {
    startSkuInvalidFlagCron();
    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 3 * * 1",
      expect.any(Function),
      null,
      true,
      "Europe/Kyiv",
    );
  });

  it("runs runSkuInvalidFlagSync on tick", async () => {
    startSkuInvalidFlagCron();
    expect(cronCallback).toBeDefined();
    if (cronCallback) await cronCallback();
    expect(runSkuInvalidFlagSync).toHaveBeenCalledTimes(1);
    expect(vi.mocked(runSkuInvalidFlagSync).mock.calls[0]![0]).toBeInstanceOf(
      Date,
    );
  });
});
