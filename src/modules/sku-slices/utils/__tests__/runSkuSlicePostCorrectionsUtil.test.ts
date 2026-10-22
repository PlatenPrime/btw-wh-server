import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiTaskAbortedError } from "../../../apitasks/kinds/apiTaskRunTypes.js";
import { packFlipAutoApplyKonks } from "../../../slices/config/packFlipAutoApplyKonks.js";

vi.mock("../correctBalunFakeStockSpikesUtil.js", () => ({
  correctBalunFakeStockSpikesUtil: vi.fn(),
}));
vi.mock("../correctBalunManualBandSpikesForRangeUtil.js", () => ({
  correctBalunManualBandSpikesForRangeUtil: vi.fn(),
}));
vi.mock("../correctSvbumFakeStockSpikesUtil.js", () => ({
  correctSvbumFakeStockSpikesUtil: vi.fn(),
}));
vi.mock("../reviewPackFlipsUtil.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../reviewPackFlipsUtil.js")>();
  return {
    ...actual,
    reviewPackFlipsUtil: vi.fn(),
  };
});
vi.mock("../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js", () => ({
  afterSkuSliceStockMutation: vi.fn(),
}));

import { correctBalunFakeStockSpikesUtil } from "../correctBalunFakeStockSpikesUtil.js";
import { correctBalunManualBandSpikesForRangeUtil } from "../correctBalunManualBandSpikesForRangeUtil.js";
import { correctSvbumFakeStockSpikesUtil } from "../correctSvbumFakeStockSpikesUtil.js";
import { reviewPackFlipsUtil } from "../reviewPackFlipsUtil.js";
import { afterSkuSliceStockMutation } from "../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { runSkuSlicePostCorrectionsUtil } from "../runSkuSlicePostCorrectionsUtil.js";

const emptyBalun = {
  konkName: "balun",
  apply: false,
  daysBack: 7,
  windowDates: [],
  patched: [],
  skipped: [],
};

const emptyManualBand = {
  konkName: "balun",
  apply: false,
  window: { dateFrom: "2026-04-02", dateTo: "2026-04-03" },
  band: { min: 9000, max: 10000 },
  patched: [],
  skipped: [],
};

const emptySvbum = {
  konkName: "svbum",
  apply: false,
  daysBack: 14,
  windowDates: [],
  patched: [],
};

const emptyPackFlip = {
  konkName: "perfect",
  apply: false,
  dates: [],
  patched: [],
  priceOnly: [],
  ambiguous: [],
};

describe("runSkuSlicePostCorrectionsUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(correctBalunFakeStockSpikesUtil).mockResolvedValue(emptyBalun);
    vi.mocked(correctBalunManualBandSpikesForRangeUtil).mockResolvedValue(emptyManualBand);
    vi.mocked(correctSvbumFakeStockSpikesUtil).mockResolvedValue(emptySvbum);
    vi.mocked(reviewPackFlipsUtil).mockResolvedValue(emptyPackFlip);
    vi.mocked(afterSkuSliceStockMutation).mockResolvedValue({
      konkName: "air",
      keysUpdated: 0,
      rollupDocs: 0,
      daysTouched: [],
      apply: true,
    });
  });

  it("runs balun then svbum then pack-flip then rollup for each day without RTL when konkName omitted", async () => {
    const onBalunError = vi.fn();
    const result = await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-02T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: false,
      rollupKonkNames: ["air"],
      hooks: { onBalunError },
    });

    expect(result.days).toHaveLength(2);
    expect(correctBalunFakeStockSpikesUtil).toHaveBeenCalledTimes(2);
    expect(correctSvbumFakeStockSpikesUtil).toHaveBeenCalledTimes(2);
    expect(reviewPackFlipsUtil).toHaveBeenCalledTimes(2 * packFlipAutoApplyKonks.length);
    expect(afterSkuSliceStockMutation).toHaveBeenCalledTimes(2);
    expect(correctBalunManualBandSpikesForRangeUtil).not.toHaveBeenCalled();
    expect(result.balunManualBand).toBeUndefined();
    expect(onBalunError).not.toHaveBeenCalled();
    expect(result.errors).toEqual([]);
  });

  it("when konkName=balun runs LTR + RTL once + rollup balun only", async () => {
    const result = await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-02T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: true,
      konkName: "balun",
      rollupKonkNames: ["air", "balun", "svbum"],
    });

    expect(result.konkName).toBe("balun");
    expect(correctBalunFakeStockSpikesUtil).toHaveBeenCalledTimes(2);
    expect(correctSvbumFakeStockSpikesUtil).not.toHaveBeenCalled();
    expect(reviewPackFlipsUtil).not.toHaveBeenCalled();
    expect(afterSkuSliceStockMutation).toHaveBeenCalledTimes(2);
    expect(afterSkuSliceStockMutation).toHaveBeenCalledWith(
      expect.objectContaining({ konkName: "balun" }),
    );
    expect(correctBalunManualBandSpikesForRangeUtil).toHaveBeenCalledOnce();
    expect(correctBalunManualBandSpikesForRangeUtil).toHaveBeenCalledWith({
      dateFrom: new Date("2026-04-02T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: true,
    });
    expect(result.balunManualBand).toEqual(emptyManualBand);
  });

  it("when konkName=svbum skips balun LTR and RTL", async () => {
    await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-03T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: false,
      konkName: "svbum",
    });

    expect(correctBalunFakeStockSpikesUtil).not.toHaveBeenCalled();
    expect(correctBalunManualBandSpikesForRangeUtil).not.toHaveBeenCalled();
    expect(correctSvbumFakeStockSpikesUtil).toHaveBeenCalledOnce();
    expect(reviewPackFlipsUtil).not.toHaveBeenCalled();
    expect(afterSkuSliceStockMutation).toHaveBeenCalledWith(
      expect.objectContaining({ konkName: "svbum" }),
    );
  });

  it("continues when balun throws and records error", async () => {
    vi.mocked(correctBalunFakeStockSpikesUtil).mockRejectedValue(new Error("balun down"));
    const onBalunError = vi.fn();

    const result = await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-03T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: true,
      rollupKonkNames: [],
      hooks: { onBalunError },
    });

    expect(onBalunError).toHaveBeenCalledOnce();
    expect(result.errors).toEqual([
      {
        step: "balun",
        asOf: "2026-04-03",
        message: "balun down",
      },
    ]);
    expect(correctSvbumFakeStockSpikesUtil).toHaveBeenCalledOnce();
    expect(reviewPackFlipsUtil).toHaveBeenCalledOnce();
    expect(correctBalunManualBandSpikesForRangeUtil).not.toHaveBeenCalled();
  });

  it("respects abort signal between days", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      runSkuSlicePostCorrectionsUtil({
        dateFrom: new Date("2026-04-02T00:00:00.000Z"),
        dateTo: new Date("2026-04-03T00:00:00.000Z"),
        apply: false,
        rollupKonkNames: [],
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(ApiTaskAbortedError);

    expect(correctBalunFakeStockSpikesUtil).not.toHaveBeenCalled();
  });

  it("reports progress per day", async () => {
    const onProgress = vi.fn();
    await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-03T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: false,
      rollupKonkNames: [],
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith(0, 1, expect.stringContaining("2026-04-03"));
    expect(onProgress).toHaveBeenCalledWith(1, 1, "Post-corrections completed");
  });
});
