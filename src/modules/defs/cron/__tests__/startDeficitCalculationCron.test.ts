import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as calcUtil from "../../controllers/calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js";
import { startDeficitCalculationCron } from "../startDeficitCalculationCron.js";

vi.mock("cron");

describe("startDeficitCalculationCron", () => {
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

    vi.spyOn(calcUtil, "calculateAndSavePogrebiDefsUtil").mockResolvedValue({
      total: 5,
      totalCriticalDefs: 2,
      totalLimitDefs: 3,
    } as never);
  });

  it("creates CronJob with expected schedule and timezone", () => {
    startDeficitCalculationCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 8-17 * * 1-5",
      expect.any(Function),
      null,
      true,
      "Europe/Kiev"
    );
  });

  it("runs deficit calculation on cron tick", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    startDeficitCalculationCron();
    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(calcUtil.calculateAndSavePogrebiDefsUtil).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("[CRON] Calculating deficits...");
    expect(logSpy).toHaveBeenCalledWith("[CRON] Completed: 5 deficits found");

    logSpy.mockRestore();
  });

  it("logs error when calculation fails", async () => {
    vi.spyOn(calcUtil, "calculateAndSavePogrebiDefsUtil").mockRejectedValue(
      new Error("calc failed")
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    startDeficitCalculationCron();
    if (cronCallback) {
      await cronCallback();
    }

    expect(errorSpy).toHaveBeenCalledWith("[CRON] Error:", "calc failed");
    errorSpy.mockRestore();
  });
});
