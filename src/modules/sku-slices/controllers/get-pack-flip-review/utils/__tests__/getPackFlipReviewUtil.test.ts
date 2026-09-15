import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getPackFlipReviewUtil } from "../getPackFlipReviewUtil.js";

const D0 = new Date("2026-09-13T00:00:00.000Z");
const D1 = new Date("2026-09-14T00:00:00.000Z");
const D2 = new Date("2026-09-15T00:00:00.000Z");

describe("getPackFlipReviewUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("returns dry-run findings without apply and without writing", async () => {
    await Sku.create({
      konkName: "perfect",
      prodName: "gemar",
      productId: "perfect-1",
      title: "Balloon",
      url: "https://perfect.example/1",
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: D0,
      data: { "perfect-1": { stock: 100, price: 100 } },
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: D1,
      data: { "perfect-1": { stock: 10000, price: 1 } },
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: D2,
      data: { "perfect-1": { stock: 100, price: 100 } },
    });

    const result = await getPackFlipReviewUtil({
      konkName: "perfect",
      dateFrom: D0,
      dateTo: D2,
    });

    expect(result).not.toHaveProperty("apply");
    expect(result.konkName).toBe("perfect");
    expect(result.dates).toEqual(["2026-09-13", "2026-09-14", "2026-09-15"]);
    expect(result.patched).toHaveLength(1);
    expect(result.patched[0]).toMatchObject({
      productId: "perfect-1",
      patched: { stock: 100, price: 100 },
    });

    const mid = await SkuSlice.findOne({ konkName: "perfect", date: D1 }).lean();
    expect(mid?.data["perfect-1"]).toEqual({ stock: 10000, price: 1 });
  });

  it("returns empty findings for a konk with no slices", async () => {
    const result = await getPackFlipReviewUtil({
      konkName: "air",
      dateFrom: D0,
      dateTo: D0,
    });
    expect(result).toEqual({
      konkName: "air",
      dates: ["2026-09-13"],
      patched: [],
      priceOnly: [],
      ambiguous: [],
    });
  });
});
