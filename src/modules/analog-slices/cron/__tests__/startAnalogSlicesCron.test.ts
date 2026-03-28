import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../../utils/calculateAirSlice.js", () => ({
  calculateAirSlice: vi.fn(),
}));
vi.mock("../../utils/calculateBalunSlice.js", () => ({
  calculateBalunSlice: vi.fn(),
}));
vi.mock("../../utils/calculateSharteSlice.js", () => ({
  calculateSharteSlice: vi.fn(),
}));
vi.mock("../../utils/calculateYumiSlice.js", () => ({
  calculateYumiSlice: vi.fn(),
}));
vi.mock("../../utils/calculateYuminSlice.js", () => ({
  calculateYuminSlice: vi.fn(),
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
  getExcludedCompetitorSet: vi.fn(),
  normalizeCompetitorName: vi.fn((value: string) => value.trim().toLowerCase()),
}));

import { calculateAirSlice } from "../../utils/calculateAirSlice.js";
import { calculateBalunSlice } from "../../utils/calculateBalunSlice.js";
import { calculateSharteSlice } from "../../utils/calculateSharteSlice.js";
import { calculateYumiSlice } from "../../utils/calculateYumiSlice.js";
import { calculateYuminSlice } from "../../utils/calculateYuminSlice.js";
import { startAnalogSlicesCron } from "../startAnalogSlicesCron.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";

describe("startAnalogSlicesCron", () => {
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

    vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set());
    vi.mocked(calculateAirSlice).mockResolvedValue({ saved: true, count: 1 });
    vi.mocked(calculateBalunSlice).mockResolvedValue({ saved: true, count: 2 });
    vi.mocked(calculateSharteSlice).mockResolvedValue({ saved: true, count: 3 });
    vi.mocked(calculateYumiSlice).mockResolvedValue({ saved: true, count: 4 });
    vi.mocked(calculateYuminSlice).mockResolvedValue({ saved: true, count: 5 });
  });

  it("creates CronJob with expected schedule", () => {
    startAnalogSlicesCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 4 * * *",
      expect.any(Function),
      null,
      true,
      "Europe/Kiev"
    );
  });

  it("does not run excluded competitors", async () => {
    vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set(["balun", "yumi"]));
    startAnalogSlicesCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(calculateAirSlice).toHaveBeenCalledTimes(1);
    expect(calculateSharteSlice).toHaveBeenCalledTimes(1);
    expect(calculateYuminSlice).toHaveBeenCalledTimes(1);
    expect(calculateBalunSlice).not.toHaveBeenCalled();
    expect(calculateYumiSlice).not.toHaveBeenCalled();
  });
});
