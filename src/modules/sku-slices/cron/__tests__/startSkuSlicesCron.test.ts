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
vi.mock("../../../../cron/analytics-notifications/formatPerfectPackFlipReport.js", () => ({
  formatPerfectPackFlipReport: vi.fn(() => "pack-flip:ok"),
}));
vi.mock("../../utils/reviewPerfectPackFlipsUtil.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../utils/reviewPerfectPackFlipsUtil.js")>();
  return {
    ...actual,
    reviewPerfectPackFlipsUtil: vi.fn(),
  };
});

import { Sku } from "../../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../../utils/runSkuSliceForKonkUtil.js";
import { startSkuSlicesCron } from "../startSkuSlicesCron.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { reviewPerfectPackFlipsUtil } from "../../utils/reviewPerfectPackFlipsUtil.js";

const emptyReview = {
  konkName: "perfect",
  apply: true,
  dates: ["2026-04-01", "2026-04-02", "2026-04-03"],
  patched: [],
  priceOnly: [],
  ambiguous: [],
};

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
    vi.mocked(reviewPerfectPackFlipsUtil).mockResolvedValue(emptyReview);
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

  it("filters excluded competitors, then reviews perfect pack-flips", async () => {
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
      const d1 = vi.mocked(runSkuSliceForKonkUtil).mock.calls[0]![1];
      expect(d1.toISOString()).toBe("2026-04-03T00:00:00.000Z");

      expect(reviewPerfectPackFlipsUtil).toHaveBeenCalledWith({
        dates: [
          new Date("2026-04-01T00:00:00.000Z"),
          new Date("2026-04-02T00:00:00.000Z"),
          new Date("2026-04-03T00:00:00.000Z"),
        ],
        apply: true,
      });
      const lastSliceOrder = Math.max(
        ...vi.mocked(runSkuSliceForKonkUtil).mock.invocationCallOrder
      );
      const reviewOrder =
        vi.mocked(reviewPerfectPackFlipsUtil).mock.invocationCallOrder[0];
      expect(reviewOrder).toBeGreaterThan(lastSliceOrder);

      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        "sku-excluded:yumi"
      );
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith("sku:air");
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith("sku:balun");
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith("pack-flip:ok");
      expect(sendCronAnalyticsReport).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not fail the cron when pack-flip review throws", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      vi.mocked(reviewPerfectPackFlipsUtil).mockRejectedValue(new Error("db down"));
      startSkuSlicesCron();
      await cronCallback?.();

      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("Perfect pack-flip review")
      );
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("db down")
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("reviews pack-flips even when no konks ran", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      vi.mocked(Sku.distinct).mockResolvedValue([] as never);
      startSkuSlicesCron();
      await cronCallback?.();

      expect(runSkuSliceForKonkUtil).not.toHaveBeenCalled();
      expect(reviewPerfectPackFlipsUtil).toHaveBeenCalledOnce();
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith("pack-flip:ok");
    } finally {
      vi.useRealTimers();
    }
  });
});
