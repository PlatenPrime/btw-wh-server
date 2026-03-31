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

import { Skugr } from "../../models/Skugr.js";
import { fillSkugrSkusFromBrowserUtil } from "../../utils/fillSkugrSkusFromBrowserUtil.js";
import { startFillSkugrSkusCron } from "../startFillSkugrSkusCron.js";

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
    const groups = [{ _id: "g1" }, { _id: "g2" }, { _id: "g3" }];
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
  });
});
