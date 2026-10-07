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
vi.mock("../../utils/runSkuSlicePostCorrectionsUtil.js", () => ({
  runSkuSlicePostCorrectionsUtil: vi.fn(),
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
  getExcludedCompetitorSet: vi.fn(),
  normalizeCompetitorName: vi.fn((value: string) => value.trim().toLowerCase()),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
  sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatSkuSlicesReport.js", () => ({
  formatSkuKonkSliceReport: vi.fn(
    (stats: { konkName: string }) => `sku:${stats.konkName}`
  ),
  formatSkuSlicesExcludedReport: vi.fn(
    (excluded: string[]) => `sku-excluded:${excluded.join(",")}`
  ),
}));
vi.mock("../../../../cron/analytics-notifications/formatPackFlipReport.js", () => ({
  formatPackFlipReport: vi.fn(() => "pack-flip:ok"),
}));

import { Sku } from "../../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../../utils/runSkuSliceForKonkUtil.js";
import { runSkuSlicePostCorrectionsUtil } from "../../utils/runSkuSlicePostCorrectionsUtil.js";
import { startSkuSlicesCron } from "../startSkuSlicesCron.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";

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
    vi.mocked(runSkuSliceForKonkUtil).mockResolvedValue({
      saved: true,
      count: 1,
      total: 1,
      invalid: 0,
      errors: 0,
    });
    vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    vi.mocked(runSkuSlicePostCorrectionsUtil).mockResolvedValue({
      apply: true,
      dateFrom: "2026-04-03",
      dateTo: "2026-04-03",
      days: [],
      errors: [],
    });
  });

  it("creates CronJob with expected schedule", () => {
    startSkuSlicesCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 0 20 * * *",
      expect.any(Function),
      null,
      true,
      "Europe/Kiev"
    );
  });

  it("filters excluded competitors then runs post-corrections for slice day", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
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
      const sliceDate = vi.mocked(runSkuSliceForKonkUtil).mock.calls[0]![1];
      expect(sliceDate.toISOString()).toBe("2026-04-03T00:00:00.000Z");

      const postOrder =
        vi.mocked(runSkuSlicePostCorrectionsUtil).mock.invocationCallOrder[0];
      const lastSliceOrder = Math.max(
        ...vi.mocked(runSkuSliceForKonkUtil).mock.invocationCallOrder
      );
      expect(postOrder).toBeGreaterThan(lastSliceOrder);

      expect(runSkuSlicePostCorrectionsUtil).toHaveBeenCalledWith({
        dateFrom: new Date("2026-04-03T00:00:00.000Z"),
        dateTo: new Date("2026-04-03T00:00:00.000Z"),
        apply: true,
        rollupKonkNames: ["air", "balun"],
        hooks: expect.objectContaining({
          onBalunError: expect.any(Function),
          onSvbumError: expect.any(Function),
          onPackFlipSuccess: expect.any(Function),
          onPackFlipError: expect.any(Function),
        }),
      });

      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        "sku-excluded:yumi"
      );
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith("sku:air");
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith("sku:balun");
      expect(sendCronAnalyticsReport).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("runs post-corrections even when no konks ran slices", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      vi.mocked(Sku.distinct).mockResolvedValue([] as never);
      startSkuSlicesCron();
      await cronCallback?.();

      expect(runSkuSliceForKonkUtil).not.toHaveBeenCalled();
      expect(runSkuSlicePostCorrectionsUtil).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("forwards balun errors to analytics via hooks", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      startSkuSlicesCron();
      await cronCallback?.();

      const hooks = vi.mocked(runSkuSlicePostCorrectionsUtil).mock.calls[0]![0]
        .hooks!;
      await hooks.onBalunError?.(new Error("balun fix down"));

      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("Balun fake stock correction")
      );
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("balun fix down")
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
