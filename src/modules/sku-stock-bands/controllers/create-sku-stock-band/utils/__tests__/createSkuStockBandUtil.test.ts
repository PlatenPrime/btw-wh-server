import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { SkuStockBand } from "../../../../models/SkuStockBand.js";
import { createSkuStockBandUtil } from "../createSkuStockBandUtil.js";

describe("createSkuStockBandUtil", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
    await Konk.deleteMany({});
    await Konk.create({
      name: "balun",
      title: "BALUN (Івано-Франківськ)",
      url: "https://example.com",
      imageUrl: "https://example.com/i.png",
      recountDays: [],
    });
  });

  it("creates band with title from Konk", async () => {
    const result = await createSkuStockBandUtil({
      konkName: "balun",
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.band.konk).toEqual({
      name: "balun",
      title: "BALUN (Івано-Франківськ)",
    });
    expect(result.band.stockMin).toBe(9500);
  });

  it("returns KONK_NOT_FOUND", async () => {
    const result = await createSkuStockBandUtil({
      konkName: "missing",
      stockMin: 1,
      stockMax: 2,
      normalMax: 0,
    });
    expect(result).toEqual({
      ok: false,
      code: "KONK_NOT_FOUND",
      message: "Konk not found: missing",
    });
  });
});
