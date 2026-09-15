import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { SkuSlice } from "../../models/SkuSlice.js";
import {
  addUtcDays,
  defaultPackFlipReviewDates,
  packFlipReviewDatesForSliceDay,
  reviewPackFlipsUtil,
  toUtcYmd,
} from "../reviewPackFlipsUtil.js";

const D0 = new Date("2026-09-13T00:00:00.000Z");
const D1 = new Date("2026-09-14T00:00:00.000Z");
const D2 = new Date("2026-09-15T00:00:00.000Z");

async function seedSlices(
  data: Array<{ date: Date; pid: Record<string, { stock: number; price: number }> }>
): Promise<void> {
  for (const row of data) {
    await SkuSlice.create({
      konkName: "perfect",
      date: row.date,
      data: row.pid,
    });
  }
}

describe("packFlip date helpers", () => {
  it("addUtcDays and toUtcYmd stay on UTC midnight", () => {
    expect(toUtcYmd(addUtcDays(D2, -1))).toBe("2026-09-14");
    expect(packFlipReviewDatesForSliceDay(D2).map(toUtcYmd)).toEqual([
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
    expect(
      packFlipReviewDatesForSliceDay(
        new Date("2026-09-01T00:00:00.000Z")
      ).map(toUtcYmd)
    ).toEqual(["2026-08-30", "2026-08-31", "2026-09-01"]);
  });

  it("defaultPackFlipReviewDates covers 7 kyiv days inclusive", () => {
    const dates = defaultPackFlipReviewDates(
      new Date("2026-09-15T10:00:00.000Z")
    );
    expect(dates.map(toUtcYmd)).toEqual([
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });
});

describe("reviewPackFlipsUtil", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
    await Sku.deleteMany({});
  });

  it("dry-run finds round-trip and does not write", async () => {
    await Sku.create({
      konkName: "perfect",
      prodName: "gemar",
      productId: "perfect-1",
      title: "Balloon",
      url: "https://perfect.example/1",
    });
    await seedSlices([
      { date: D0, pid: { "perfect-1": { stock: 100, price: 100 } } },
      { date: D1, pid: { "perfect-1": { stock: 10000, price: 1 } } },
      { date: D2, pid: { "perfect-1": { stock: 100, price: 100 } } },
    ]);

    const result = await reviewPackFlipsUtil({
      dates: [D0, D1, D2],
      apply: false,
      konkName: "perfect",
    });

    expect(result.patched).toHaveLength(1);
    expect(result.patched[0]).toMatchObject({
      productId: "perfect-1",
      title: "Balloon",
      date: "2026-09-14",
      factor: 100,
      patched: { stock: 100, price: 100 },
    });

    const mid = await SkuSlice.findOne({ konkName: "perfect", date: D1 }).lean();
    expect(mid?.data["perfect-1"]).toEqual({ stock: 10000, price: 1 });
  });

  it("apply rescales the anomalous day in one update", async () => {
    await seedSlices([
      { date: D0, pid: { "perfect-1": { stock: 100, price: 100 } } },
      { date: D1, pid: { "perfect-1": { stock: 10000, price: 1 } } },
      { date: D2, pid: { "perfect-1": { stock: 100, price: 100 } } },
    ]);

    const result = await reviewPackFlipsUtil({
      dates: [D0, D1, D2],
      apply: true,
      konkName: "perfect",
    });

    expect(result.apply).toBe(true);
    expect(result.patched).toHaveLength(1);

    const mid = await SkuSlice.findOne({ konkName: "perfect", date: D1 }).lean();
    expect(mid?.data["perfect-1"]).toEqual({ stock: 100, price: 100 });
    const today = await SkuSlice.findOne({ konkName: "perfect", date: D2 }).lean();
    expect(today?.data["perfect-1"]).toEqual({ stock: 100, price: 100 });
  });

  it("patches today's spike when yesterday matches d-2", async () => {
    await seedSlices([
      { date: D0, pid: { "perfect-1": { stock: 500, price: 200 } } },
      { date: D1, pid: { "perfect-1": { stock: 500, price: 200 } } },
      { date: D2, pid: { "perfect-1": { stock: 1000, price: 100 } } },
    ]);

    await reviewPackFlipsUtil({
      dates: [D0, D1, D2],
      apply: true,
      konkName: "perfect",
    });

    const today = await SkuSlice.findOne({ konkName: "perfect", date: D2 }).lean();
    expect(today?.data["perfect-1"]).toEqual({ stock: 500, price: 200 });
  });

  it("does not rescale today's return to normal", async () => {
    await seedSlices([
      { date: D0, pid: { "perfect-1": { stock: 100, price: 100 } } },
      { date: D1, pid: { "perfect-1": { stock: 10000, price: 1 } } },
      { date: D2, pid: { "perfect-1": { stock: 100, price: 100 } } },
    ]);

    await reviewPackFlipsUtil({
      dates: [D0, D1, D2],
      apply: true,
      konkName: "perfect",
    });

    const today = await SkuSlice.findOne({ konkName: "perfect", date: D2 }).lean();
    expect(today?.data["perfect-1"]).toEqual({ stock: 100, price: 100 });
  });

  it("reports price-only without writing", async () => {
    await seedSlices([
      { date: D1, pid: { "perfect-1": { stock: 100, price: 100 } } },
      { date: D2, pid: { "perfect-1": { stock: 95, price: 1 } } },
    ]);

    const result = await reviewPackFlipsUtil({
      dates: [D1, D2],
      apply: true,
      konkName: "perfect",
    });

    expect(result.patched).toEqual([]);
    expect(result.priceOnly).toEqual([
      expect.objectContaining({
        productId: "perfect-1",
        kind: "price-only",
        date: "2026-09-15",
        factor: 100,
      }),
    ]);
    const today = await SkuSlice.findOne({ konkName: "perfect", date: D2 }).lean();
    expect(today?.data["perfect-1"]).toEqual({ stock: 95, price: 1 });
  });

  it("scopes by konkName and ignores other competitors", async () => {
    await seedSlices([
      { date: D0, pid: { "perfect-1": { stock: 100, price: 100 } } },
      { date: D1, pid: { "perfect-1": { stock: 10000, price: 1 } } },
      { date: D2, pid: { "perfect-1": { stock: 100, price: 100 } } },
    ]);
    await SkuSlice.create({
      konkName: "air",
      date: D0,
      data: { "air-1": { stock: 50, price: 20 } },
    });
    await SkuSlice.create({
      konkName: "air",
      date: D1,
      data: { "air-1": { stock: 100, price: 10 } },
    });
    await SkuSlice.create({
      konkName: "air",
      date: D2,
      data: { "air-1": { stock: 50, price: 20 } },
    });

    const result = await reviewPackFlipsUtil({
      dates: [D0, D1, D2],
      apply: false,
      konkName: "air",
    });

    expect(result.konkName).toBe("air");
    expect(result.patched).toEqual([
      expect.objectContaining({ productId: "air-1", factor: 2 }),
    ]);
  });

  it("returns empty result for empty dates without throwing", async () => {
    const result = await reviewPackFlipsUtil({
      dates: [],
      apply: true,
      konkName: "perfect",
    });
    expect(result).toMatchObject({
      konkName: "perfect",
      patched: [],
      priceOnly: [],
      ambiguous: [],
      dates: [],
    });
  });
});
