import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../../../skus/models/Sku.js", () => ({
  Sku: {
    distinct: vi.fn(),
  },
}));
vi.mock("../../utils/runSkuSliceForKonkUtil.js", () => ({
  runSkuSliceForKonkUtil: vi.fn(),
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
  getExcludedCompetitorSet: vi.fn(),
  normalizeCompetitorName: vi.fn((value: string) => value.trim().toLowerCase()),
}));

import { Sku } from "../../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../../utils/runSkuSliceForKonkUtil.js";
import { startSkuSlicesCron } from "../startSkuSlicesCron.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";

describe("startSkuSlicesCron", () => {
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
    vi.mocked(Sku.distinct).mockResolvedValue(["air", " Air ", "balun", "", "yumi"] as never);
    vi.mocked(runSkuSliceForKonkUtil).mockResolvedValue({ saved: true, count: 1 });
  });

  it("creates CronJob with expected schedule", () => {
    startSkuSlicesCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 0 * * *",
      expect.any(Function),
      null,
      true,
      "Europe/Kiev"
    );
  });

  it("filters excluded competitors and removes duplicates case-insensitively", async () => {
    vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set(["yumi"]));
    startSkuSlicesCron();

    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(runSkuSliceForKonkUtil).toHaveBeenCalledTimes(2);
    expect(runSkuSliceForKonkUtil).toHaveBeenNthCalledWith(
      1,
      "air",
      expect.any(Date)
    );
    expect(runSkuSliceForKonkUtil).toHaveBeenNthCalledWith(
      2,
      "balun",
      expect.any(Date)
    );
  });
});
