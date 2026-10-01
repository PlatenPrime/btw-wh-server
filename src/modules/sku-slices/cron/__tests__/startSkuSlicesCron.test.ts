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
vi.mock("../../../../cron/analytics-notifications/formatPackFlipReport.js", () => ({
  formatPackFlipReport: vi.fn(() => "pack-flip:ok"),
}));
vi.mock("../../utils/reviewPackFlipsUtil.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../utils/reviewPackFlipsUtil.js")>();
  return {
    ...actual,
    reviewPackFlipsUtil: vi.fn(),
  };
});
vi.mock("../../utils/correctBalunFakeStockSpikesUtil.js", () => ({
  correctBalunFakeStockSpikesUtil: vi.fn(),
}));
vi.mock("../../utils/correctSvbumFakeStockSpikesUtil.js", () => ({
  correctSvbumFakeStockSpikesUtil: vi.fn(),
}));

import { Sku } from "../../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../../utils/runSkuSliceForKonkUtil.js";
import { startSkuSlicesCron } from "../startSkuSlicesCron.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { reviewPackFlipsUtil } from "../../utils/reviewPackFlipsUtil.js";
import { correctBalunFakeStockSpikesUtil } from "../../utils/correctBalunFakeStockSpikesUtil.js";
import { correctSvbumFakeStockSpikesUtil } from "../../utils/correctSvbumFakeStockSpikesUtil.js";

const emptyReview = {
  konkName: "perfect",
  apply: true,
  dates: ["2026-04-01", "2026-04-02", "2026-04-03"],
  patched: [],
  priceOnly: [],
  ambiguous: [],
};

const emptyBalunFix = {
  konkName: "balun",
  apply: true,
  daysBack: 1,
  windowDates: ["2026-04-03"],
  patched: [],
  skipped: [],
};

const emptySvbumFix = {
  konkName: "svbum",
  apply: true,
  daysBack: 14,
  windowDates: [],
  patched: [],
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
    vi.mocked(reviewPackFlipsUtil).mockResolvedValue(emptyReview);
    vi.mocked(correctBalunFakeStockSpikesUtil).mockResolvedValue(emptyBalunFix);
    vi.mocked(correctSvbumFakeStockSpikesUtil).mockResolvedValue(emptySvbumFix);
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

  it("filters excluded competitors, then corrects balun/svbum and reviews pack-flips", async () => {
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

      expect(correctBalunFakeStockSpikesUtil).toHaveBeenCalledWith({
        daysBack: 1,
        asOf: new Date("2026-04-03T00:00:00.000Z"),
        apply: true,
      });
      expect(correctSvbumFakeStockSpikesUtil).toHaveBeenCalledWith({
        daysBack: 14,
        asOf: new Date("2026-04-03T00:00:00.000Z"),
        apply: true,
      });
      expect(reviewPackFlipsUtil).toHaveBeenCalledWith({
        dates: [
          new Date("2026-04-01T00:00:00.000Z"),
          new Date("2026-04-02T00:00:00.000Z"),
          new Date("2026-04-03T00:00:00.000Z"),
        ],
        apply: true,
        konkName: "perfect",
      });
      const lastSliceOrder = Math.max(
        ...vi.mocked(runSkuSliceForKonkUtil).mock.invocationCallOrder
      );
      const balunFixOrder =
        vi.mocked(correctBalunFakeStockSpikesUtil).mock.invocationCallOrder[0];
      const svbumFixOrder =
        vi.mocked(correctSvbumFakeStockSpikesUtil).mock.invocationCallOrder[0];
      const reviewOrder =
        vi.mocked(reviewPackFlipsUtil).mock.invocationCallOrder[0];
      expect(balunFixOrder).toBeGreaterThan(lastSliceOrder);
      expect(svbumFixOrder).toBeGreaterThan(balunFixOrder!);
      expect(reviewOrder).toBeGreaterThan(svbumFixOrder!);

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

  it("does not fail the cron when balun fake stock correction throws", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      vi.mocked(correctBalunFakeStockSpikesUtil).mockRejectedValue(
        new Error("balun fix down")
      );
      startSkuSlicesCron();
      await cronCallback?.();

      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("Balun fake stock correction")
      );
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("balun fix down")
      );
      expect(correctSvbumFakeStockSpikesUtil).toHaveBeenCalledOnce();
      expect(reviewPackFlipsUtil).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not fail the cron when svbum fake stock correction throws", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      vi.mocked(correctSvbumFakeStockSpikesUtil).mockRejectedValue(
        new Error("svbum fix down")
      );
      startSkuSlicesCron();
      await cronCallback?.();

      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("Svbum fake stock correction")
      );
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("svbum fix down")
      );
      expect(reviewPackFlipsUtil).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not fail the cron when pack-flip review throws", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      vi.mocked(reviewPackFlipsUtil).mockRejectedValue(new Error("db down"));
      startSkuSlicesCron();
      await cronCallback?.();

      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("Pack-flip review (perfect)")
      );
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith(
        expect.stringContaining("db down")
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("corrects balun/svbum and reviews pack-flips even when no konks ran", async () => {
    vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
    try {
      vi.mocked(Sku.distinct).mockResolvedValue([] as never);
      startSkuSlicesCron();
      await cronCallback?.();

      expect(runSkuSliceForKonkUtil).not.toHaveBeenCalled();
      expect(correctBalunFakeStockSpikesUtil).toHaveBeenCalledOnce();
      expect(correctSvbumFakeStockSpikesUtil).toHaveBeenCalledOnce();
      expect(reviewPackFlipsUtil).toHaveBeenCalledOnce();
      expect(sendCronAnalyticsReport).toHaveBeenCalledWith("pack-flip:ok");
    } finally {
      vi.useRealTimers();
    }
  });
});
