import { describe, expect, it } from "vitest";
import {
  areSamePriceScale,
  decidePackFlipPatchesForSeries,
  detectInversePackFlip,
  detectPriceOnlyPackFlip,
  isUsablePackFlipPoint,
  nearestIntegerFactor,
  readPackFlipPoint,
  rescaleToNeighborScale,
  type SeriesDay,
  type SlicePoint,
} from "../detectPackFlipSpike.js";

function pt(stock: number, price: number): SlicePoint {
  return { stock, price };
}

function series(points: (SlicePoint | null)[]): SeriesDay[] {
  const start = Date.UTC(2026, 8, 11);
  return points.map((point, i) => ({
    dateMs: start + i * 24 * 60 * 60 * 1000,
    point,
  }));
}

describe("nearestIntegerFactor", () => {
  it("accepts integer factors >= 2 and their inverses", () => {
    expect(nearestIntegerFactor(100)).toBe(100);
    expect(nearestIntegerFactor(0.01)).toBe(100);
    expect(nearestIntegerFactor(2)).toBe(2);
    expect(nearestIntegerFactor(0.5)).toBe(2);
  });

  it("rejects near-1 and non-integer ratios", () => {
    expect(nearestIntegerFactor(1)).toBeNull();
    expect(nearestIntegerFactor(0.95)).toBeNull();
    expect(nearestIntegerFactor(1.4)).toBeNull();
    expect(nearestIntegerFactor(0)).toBeNull();
    expect(nearestIntegerFactor(-2)).toBeNull();
  });
});

describe("isUsablePackFlipPoint / readPackFlipPoint", () => {
  it("rejects -1, zero and non-finite", () => {
    expect(isUsablePackFlipPoint(pt(-1, -1))).toBe(false);
    expect(isUsablePackFlipPoint(pt(0, 10))).toBe(false);
    expect(isUsablePackFlipPoint(pt(10, 0))).toBe(false);
    expect(isUsablePackFlipPoint({ stock: NaN, price: 1 })).toBe(false);
    expect(readPackFlipPoint({ stock: -1, price: -1 })).toBeNull();
    expect(readPackFlipPoint({ stock: 0, price: 10 })).toBeNull();
    expect(readPackFlipPoint({ stock: 10, price: 20 })).toEqual(pt(10, 20));
  });
});

describe("detectInversePackFlip", () => {
  it("detects 100@100 ↔ 10000@1", () => {
    const flip = detectInversePackFlip(pt(100, 100), pt(10000, 1));
    expect(flip).toEqual({
      kind: "inverse",
      factor: 100,
      currStockScaledUp: true,
    });
    expect(detectInversePackFlip(pt(10000, 1), pt(100, 100))).toEqual({
      kind: "inverse",
      factor: 100,
      currStockScaledUp: false,
    });
  });

  it("detects 2x screenshot-like jump", () => {
    expect(detectInversePackFlip(pt(500, 200), pt(1000, 100))).toEqual({
      kind: "inverse",
      factor: 2,
      currStockScaledUp: true,
    });
  });

  it("does not treat real sales or restock as flip", () => {
    expect(detectInversePackFlip(pt(100, 100), pt(90, 100))).toBeNull();
    expect(detectInversePackFlip(pt(100, 100), pt(200, 100))).toBeNull();
  });

  it("skips -1 / unusable points", () => {
    expect(detectInversePackFlip(pt(-1, -1), pt(100, 100))).toBeNull();
    expect(detectInversePackFlip(pt(100, 100), pt(-1, -1))).toBeNull();
  });
});

describe("detectPriceOnlyPackFlip", () => {
  it("flags price factor with stock within ±10%", () => {
    expect(detectPriceOnlyPackFlip(pt(100, 100), pt(95, 1))).toEqual({
      kind: "price-only",
      factor: 100,
    });
  });

  it("does not flag inverse as price-only", () => {
    expect(detectPriceOnlyPackFlip(pt(100, 100), pt(10000, 1))).toBeNull();
  });

  it("does not flag stock move beyond 10%", () => {
    expect(detectPriceOnlyPackFlip(pt(100, 100), pt(80, 1))).toBeNull();
  });
});

describe("rescaleToNeighborScale", () => {
  it("restores anomaly toward neighbor", () => {
    expect(rescaleToNeighborScale(pt(100, 100), pt(10000, 1))).toEqual(
      pt(100, 100)
    );
    expect(rescaleToNeighborScale(pt(10000, 1), pt(100, 100))).toEqual(
      pt(10000, 1)
    );
    expect(rescaleToNeighborScale(pt(500, 200), pt(1000, 100))).toEqual(
      pt(500, 200)
    );
  });
});

describe("areSamePriceScale", () => {
  it("true when prices are not an integer factor apart", () => {
    expect(areSamePriceScale(pt(100, 100), pt(95, 100))).toBe(true);
    expect(areSamePriceScale(pt(100, 100), pt(10000, 1))).toBe(false);
  });
});

describe("decidePackFlipPatchesForSeries", () => {
  it("patches the middle day of a round-trip", () => {
    const decisions = decidePackFlipPatchesForSeries(
      series([pt(100, 100), pt(10000, 1), pt(100, 100)])
    );
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({
      kind: "inverse",
      index: 1,
      neighborIndex: 0,
      factor: 100,
      from: pt(10000, 1),
      patched: pt(100, 100),
    });
  });

  it("patches today when yesterday is stable vs d-2", () => {
    const decisions = decidePackFlipPatchesForSeries(
      series([pt(100, 100), pt(100, 100), pt(10000, 1)])
    );
    expect(decisions).toEqual([
      expect.objectContaining({
        kind: "inverse",
        index: 2,
        neighborIndex: 1,
        patched: pt(100, 100),
      }),
    ]);
  });

  it("does not rescale today's return to normal", () => {
    const decisions = decidePackFlipPatchesForSeries(
      series([pt(100, 100), pt(10000, 1), pt(100, 100)])
    );
    expect(decisions.every((d) => d.index !== 2)).toBe(true);
  });

  it("patches a leading spike when the rest of the window is stable", () => {
    const decisions = decidePackFlipPatchesForSeries(
      series([pt(10000, 1), pt(100, 100), pt(100, 100)])
    );
    expect(decisions).toEqual([
      expect.objectContaining({
        kind: "inverse",
        index: 0,
        neighborIndex: 1,
        patched: pt(100, 100),
      }),
    ]);
  });

  it("does not flag real sales or restock", () => {
    expect(
      decidePackFlipPatchesForSeries(
        series([pt(100, 100), pt(90, 100), pt(80, 100)])
      )
    ).toEqual([]);
    expect(
      decidePackFlipPatchesForSeries(
        series([pt(100, 100), pt(200, 100), pt(200, 100)])
      )
    ).toEqual([]);
  });

  it("reports price-only without a patch", () => {
    const decisions = decidePackFlipPatchesForSeries(
      series([pt(100, 100), pt(95, 1)])
    );
    expect(decisions).toEqual([
      expect.objectContaining({
        kind: "price-only",
        index: 1,
        factor: 100,
        from: pt(95, 1),
      }),
    ]);
    expect(decisions[0]?.patched).toBeUndefined();
  });

  it("marks ambiguous when both jumps stay inverse to d-2", () => {
    const decisions = decidePackFlipPatchesForSeries(
      series([pt(100, 100), pt(10000, 1), pt(1000000, 0.01)])
    );
    expect(decisions.some((d) => d.kind === "ambiguous")).toBe(true);
    expect(decisions.some((d) => d.kind === "inverse")).toBe(false);
  });
});
