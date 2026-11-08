import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkuStockBand } from "../../../../../sku-stock-bands/models/SkuStockBand.js";
import { batchCorrectStockBandUtil } from "../batchCorrectStockBandUtil.js";

vi.mock("../../../../utils/correctManualBandSpikesForRangeUtil.js", () => ({
  correctManualBandSpikesForRangeUtil: vi.fn(async () => ({
    konkName: "balun",
    apply: true,
    window: { dateFrom: "2026-10-26", dateTo: "2026-11-08" },
    band: { min: 9500, max: 10500, normalMax: 500 },
    patched: [{ productId: "balun-1", date: "2026-10-27", from: 10000, to: 120 }],
    skipped: [],
  })),
}));

import { correctManualBandSpikesForRangeUtil } from "../../../../utils/correctManualBandSpikesForRangeUtil.js";

describe("batchCorrectStockBandUtil", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
    vi.mocked(correctManualBandSpikesForRangeUtil).mockClear();
  });

  it("loads band and applies correction with normalMax", async () => {
    const band = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    const dateFrom = new Date("2026-10-26T00:00:00.000Z");
    const dateTo = new Date("2026-11-08T00:00:00.000Z");
    const onProgress = vi.fn();

    const result = await batchCorrectStockBandUtil(
      {
        bandId: String(band._id),
        dateFrom,
        dateTo,
        productIds: ["balun-1"],
      },
      { onProgress },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bandId).toBe(String(band._id));
    expect(result.result.patched).toHaveLength(1);
    expect(correctManualBandSpikesForRangeUtil).toHaveBeenCalledWith({
      konkName: "balun",
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
      dateFrom,
      dateTo,
      productIds: ["balun-1"],
      apply: true,
      signal: undefined,
      onProgress,
    });
  });

  it("returns BAND_NOT_FOUND", async () => {
    const result = await batchCorrectStockBandUtil({
      bandId: "507f1f77bcf86cd799439011",
      dateFrom: new Date("2026-10-26T00:00:00.000Z"),
      dateTo: new Date("2026-11-08T00:00:00.000Z"),
      productIds: ["balun-1"],
    });
    expect(result).toEqual({
      ok: false,
      code: "BAND_NOT_FOUND",
      message: "Sku stock band not found",
    });
  });
});
