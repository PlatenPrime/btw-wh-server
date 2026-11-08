import { beforeEach, describe, expect, it } from "vitest";
import { SkuStockBand } from "../SkuStockBand.js";

describe("SkuStockBand Model", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
  });

  it("saves valid band", async () => {
    const saved = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    expect(saved.konk.name).toBe("balun");
    expect(saved.konk.title).toBe("BALUN");
    expect(saved.stockMin).toBe(9500);
    expect(saved.stockMax).toBe(10500);
    expect(saved.normalMax).toBe(500);
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it("lowercases konk.name", async () => {
    const saved = await SkuStockBand.create({
      konk: { name: "BALUN", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    expect(saved.konk.name).toBe("balun");
  });

  it("rejects missing konk.title", async () => {
    const doc = new SkuStockBand({
      konk: { name: "balun" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    await expect(doc.save()).rejects.toThrow();
  });

  it("rejects stockMax < stockMin", async () => {
    const doc = new SkuStockBand({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 10500,
      stockMax: 9500,
      normalMax: 500,
    });
    await expect(doc.save()).rejects.toThrow();
  });

  it("rejects normalMax >= stockMin", async () => {
    const doc = new SkuStockBand({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 9500,
    });
    await expect(doc.save()).rejects.toThrow();
  });

  it("allows multiple bands per konk", async () => {
    await SkuStockBand.create({
      konk: { name: "svbum", title: "SVBUM" },
      stockMin: 5_000_000,
      stockMax: 6_000_000,
      normalMax: 100_000,
    });
    await SkuStockBand.create({
      konk: { name: "svbum", title: "SVBUM" },
      stockMin: 9_000_000,
      stockMax: 10_000_000,
      normalMax: 100_000,
    });
    expect(await SkuStockBand.countDocuments({ "konk.name": "svbum" })).toBe(2);
  });
});
