import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkuStockBand } from "../../../../../sku-stock-bands/models/SkuStockBand.js";
import { discoverStockBandUtil } from "../discoverStockBandUtil.js";

vi.mock("../../../discover-band-spike/utils/discoverBandSpikeUtil.js", () => ({
  discoverBandSpikeUtil: vi.fn(async () => ({
    konkName: "balun",
    window: { dateFrom: "2026-10-26", dateTo: "2026-11-08" },
    band: { min: 9500, max: 10500 },
    items: [
      {
        skuId: "507f1f77bcf86cd799439011",
        productId: "balun-1",
        title: "Balloon",
        imageUrl: "https://example.com/a.png",
        runs: [{ dateFrom: "2026-10-26", dateTo: "2026-11-06", peakStock: 10000 }],
      },
    ],
  })),
}));

import { discoverBandSpikeUtil } from "../../../discover-band-spike/utils/discoverBandSpikeUtil.js";

describe("discoverStockBandUtil", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
    vi.mocked(discoverBandSpikeUtil).mockClear();
  });

  it("loads band and delegates discover", async () => {
    const band = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    const dateFrom = new Date("2026-10-26T00:00:00.000Z");
    const dateTo = new Date("2026-11-08T00:00:00.000Z");

    const result = await discoverStockBandUtil({
      bandId: String(band._id),
      dateFrom,
      dateTo,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bandId).toBe(String(band._id));
    expect(result.band).toEqual({ min: 9500, max: 10500, normalMax: 500 });
    expect(result.items).toHaveLength(1);
    expect(discoverBandSpikeUtil).toHaveBeenCalledWith({
      konkName: "balun",
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
      dateFrom,
      dateTo,
    });
  });

  it("returns BAND_NOT_FOUND", async () => {
    const result = await discoverStockBandUtil({
      bandId: "507f1f77bcf86cd799439011",
      dateFrom: new Date("2026-10-26T00:00:00.000Z"),
      dateTo: new Date("2026-11-08T00:00:00.000Z"),
    });
    expect(result).toEqual({
      ok: false,
      code: "BAND_NOT_FOUND",
      message: "Sku stock band not found",
    });
  });
});
