import { describe, expect, it } from "vitest";
import {
  computeBalunFakeStockPatches,
  computeBalunFakeStockPatchesForSeries,
  isAdequateBalunStock,
  isBalunFakeStock,
  type BalunStockDay,
} from "../correctBalunFakeStockSpikes.js";

const D0 = Date.UTC(2026, 8, 13);
const D1 = Date.UTC(2026, 8, 14);
const D2 = Date.UTC(2026, 8, 15);
const D3 = Date.UTC(2026, 8, 16);

function day(dateMs: number, stock: number | undefined): BalunStockDay {
  return { dateMs, stock };
}

describe("isAdequateBalunStock / isBalunFakeStock", () => {
  it("treats inclusive 9950–10000 as fake and -1 as inadequate", () => {
    expect(isBalunFakeStock(9950)).toBe(true);
    expect(isBalunFakeStock(9975)).toBe(true);
    expect(isBalunFakeStock(9999)).toBe(true);
    expect(isBalunFakeStock(10000)).toBe(true);
    expect(isBalunFakeStock(9949)).toBe(false);
    expect(isBalunFakeStock(10001)).toBe(false);
    expect(isAdequateBalunStock(10000)).toBe(false);
    expect(isAdequateBalunStock(9950)).toBe(false);
    expect(isAdequateBalunStock(-1)).toBe(false);
    expect(isAdequateBalunStock(543)).toBe(true);
    expect(isAdequateBalunStock(9949)).toBe(true);
    expect(isAdequateBalunStock(0)).toBe(true);
  });

  it("treats inclusive 4990–5000 spike range as fake", () => {
    expect(isBalunFakeStock(4990)).toBe(true);
    expect(isBalunFakeStock(4995)).toBe(true);
    expect(isBalunFakeStock(5000)).toBe(true);
    expect(isBalunFakeStock(4989)).toBe(false);
    expect(isBalunFakeStock(5001)).toBe(false);
    expect(isAdequateBalunStock(4990)).toBe(false);
    expect(isAdequateBalunStock(5000)).toBe(false);
    expect(isAdequateBalunStock(4989)).toBe(true);
    expect(isAdequateBalunStock(5001)).toBe(true);
  });
});

describe("computeBalunFakeStockPatchesForSeries", () => {
  it("replaces consecutive fake range values with left adequate", () => {
    const series = [
      day(D0, 543),
      day(D1, 10000),
      day(D2, 9975),
      day(D3, 200),
    ];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D3
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D1, from: 10000, to: 543 },
      { productId: "balun-1", dateMs: D2, from: 9975, to: 543 },
    ]);
  });

  it("does not patch 9949 just below the fake range", () => {
    const series = [day(D0, 100), day(D1, 9949)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D1
    );
    expect(patches).toEqual([]);
    expect(skipped).toEqual([]);
  });

  it("patches 9950 at the lower bound", () => {
    const series = [day(D0, 80), day(D1, 9950)];
    const { patches } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D1
    );
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D1, from: 9950, to: 80 },
    ]);
  });

  it("uses nearest right adequate when no left", () => {
    const series = [day(D0, 10000), day(D1, 50)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D1
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D0, from: 10000, to: 50 },
    ]);
  });

  it("skips -1 when searching left adequate", () => {
    const series = [day(D0, 543), day(D1, -1), day(D2, 9999)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D2
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D2, from: 9999, to: 543 },
    ]);
  });

  it("does not treat -1 as adequate neighbor", () => {
    const series = [day(D0, -1), day(D1, 10000)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D1
    );
    expect(patches).toEqual([]);
    expect(skipped).toEqual([
      { productId: "balun-1", dateMs: D1, reason: "no-adequate-neighbor" },
    ]);
  });

  it("skips when no adequate neighbor on either side", () => {
    const series = [day(D0, 5000)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D0
    );
    expect(patches).toEqual([]);
    expect(skipped).toEqual([
      { productId: "balun-1", dateMs: D0, reason: "no-adequate-neighbor" },
    ]);
  });

  it("replaces leading consecutive 5000 with nearest right adequate", () => {
    const series = [day(D0, 5000), day(D1, 5000), day(D2, 4)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D2
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D0, from: 5000, to: 4 },
      { productId: "balun-1", dateMs: D1, from: 5000, to: 4 },
    ]);
  });

  it("uses lookback outside window but only patches inside window", () => {
    const series = [day(D0, 777), day(D1, 10000), day(D2, 9950)];
    const { patches } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D1,
      D2
    );
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D1, from: 10000, to: 777 },
      { productId: "balun-1", dateMs: D2, from: 9950, to: 777 },
    ]);
  });

  it("does not patch fake stock that is only in lookback", () => {
    const series = [day(D0, 10000), day(D1, 50)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D1,
      D1
    );
    expect(patches).toEqual([]);
    expect(skipped).toEqual([]);
  });

  it("ignores missing stock points", () => {
    const series = [day(D0, 10), day(D1, undefined), day(D2, 10000)];
    const { patches } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D2
    );
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D2, from: 10000, to: 10 },
    ]);
  });

  it("replaces spike-range mid value with left adequate", () => {
    const series = [day(D0, 4), day(D1, 4995), day(D2, 4)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D2
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D1, from: 4995, to: 4 },
    ]);
  });

  it("replaces exact 5000 spike with left adequate", () => {
    const series = [day(D0, 4), day(D1, 5000), day(D2, 4)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D2
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D1, from: 5000, to: 4 },
    ]);
  });

  it("replaces consecutive spike-range values with the same left adequate", () => {
    const series = [day(D0, 4), day(D1, 4990), day(D2, 5000)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D2
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D1, from: 4990, to: 4 },
      { productId: "balun-1", dateMs: D2, from: 5000, to: 4 },
    ]);
  });

  it("replaces mixed spike-range and clamp fake with left adequate", () => {
    const series = [day(D0, 100), day(D1, 4992), day(D2, 10000)];
    const { patches, skipped } = computeBalunFakeStockPatchesForSeries(
      "balun-1",
      series,
      D0,
      D2
    );
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { productId: "balun-1", dateMs: D1, from: 4992, to: 100 },
      { productId: "balun-1", dateMs: D2, from: 10000, to: 100 },
    ]);
  });
});

describe("computeBalunFakeStockPatches", () => {
  it("aggregates patches across productIds", () => {
    const map = new Map<string, BalunStockDay[]>([
      ["a", [day(D0, 1), day(D1, 10000)]],
      ["b", [day(D0, 2), day(D1, 9975)]],
    ]);
    const { patches } = computeBalunFakeStockPatches(map, D0, D1);
    expect(patches).toHaveLength(2);
    expect(patches.map((p) => p.productId).sort()).toEqual(["a", "b"]);
  });
});
