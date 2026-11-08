import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { SkuStockBand } from "../../../../models/SkuStockBand.js";
import { updateSkuStockBandByIdUtil } from "../updateSkuStockBandByIdUtil.js";

describe("updateSkuStockBandByIdUtil", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
    await Konk.deleteMany({});
    await Konk.create([
      {
        name: "balun",
        title: "BALUN",
        url: "https://example.com/b",
        imageUrl: "https://example.com/b.png",
        recountDays: [],
      },
      {
        name: "svbum",
        title: "SVBUM",
        url: "https://example.com/s",
        imageUrl: "https://example.com/s.png",
        recountDays: [],
      },
    ]);
  });

  it("updates bounds", async () => {
    const created = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    const result = await updateSkuStockBandByIdUtil({
      id: String(created._id),
      normalMax: 800,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.band.normalMax).toBe(800);
  });

  it("updates konk from Konk collection", async () => {
    const created = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    const result = await updateSkuStockBandByIdUtil({
      id: String(created._id),
      konkName: "svbum",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.band.konk).toEqual({ name: "svbum", title: "SVBUM" });
  });

  it("rejects invalid merged bounds", async () => {
    const created = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    const result = await updateSkuStockBandByIdUtil({
      id: String(created._id),
      normalMax: 9600,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_BOUNDS");
  });

  it("returns NOT_FOUND", async () => {
    const result = await updateSkuStockBandByIdUtil({
      id: "507f1f77bcf86cd799439011",
      stockMin: 1,
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });
});
