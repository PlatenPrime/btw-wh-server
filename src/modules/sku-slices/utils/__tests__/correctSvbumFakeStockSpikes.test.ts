import { describe, expect, it } from "vitest";
import {
  computeSvbumFakeStockPatches,
  computeSvbumFakeStockPatchesForSeries,
  isSvbumFakeStock,
  type SvbumStockDay,
} from "../correctSvbumFakeStockSpikes.js";

const D0 = Date.UTC(2026, 8, 13);
const D1 = Date.UTC(2026, 8, 14);
const D2 = Date.UTC(2026, 8, 15);
const D3 = Date.UTC(2026, 8, 16);
const D4 = Date.UTC(2026, 8, 17);

function day(dateMs: number, stock: number | undefined): SvbumStockDay {
  return { dateMs, stock };
}

describe("isSvbumFakeStock", () => {
  it("is strict greater than 900_000", () => {
    expect(isSvbumFakeStock(900_000)).toBe(false);
    expect(isSvbumFakeStock(900_001)).toBe(true);
    expect(isSvbumFakeStock(6_000_000)).toBe(true);
    expect(isSvbumFakeStock(10_000)).toBe(false);
  });
});

describe("computeSvbumFakeStockPatchesForSeries", () => {
  it("zeros sandwich including middle normal day", () => {
    const series = [
      day(D0, 6_000_000),
      day(D1, 10_000),
      day(D2, 6_000_000),
    ];
    const { patches } = computeSvbumFakeStockPatchesForSeries(
      "svbum-1",
      series,
      D0,
      D2
    );
    expect(patches).toEqual([
      { productId: "svbum-1", dateMs: D0, from: 6_000_000, to: 0 },
      { productId: "svbum-1", dateMs: D1, from: 10_000, to: 0 },
      { productId: "svbum-1", dateMs: D2, from: 6_000_000, to: 0 },
    ]);
  });

  it("does not zero trailing spike before grace days", () => {
    const series = [day(D0, 6_000_000), day(D1, 10_000)];
    const { patches } = computeSvbumFakeStockPatchesForSeries(
      "svbum-1",
      series,
      D0,
      D1,
      2
    );
    expect(patches).toEqual([]);
  });

  it("zeros lone spike after grace days, not the following normals", () => {
    const series = [
      day(D0, 6_000_000),
      day(D1, 100),
      day(D2, 100),
      day(D3, 100),
    ];
    const { patches } = computeSvbumFakeStockPatchesForSeries(
      "svbum-1",
      series,
      D0,
      D3,
      2
    );
    expect(patches).toEqual([
      { productId: "svbum-1", dateMs: D0, from: 6_000_000, to: 0 },
    ]);
  });

  it("does not treat 900_000 as fake", () => {
    const series = [day(D0, 50), day(D1, 900_000), day(D2, 50), day(D3, 50)];
    const { patches } = computeSvbumFakeStockPatchesForSeries(
      "svbum-1",
      series,
      D0,
      D3,
      2
    );
    expect(patches).toEqual([]);
  });

  it("only patches days inside the window", () => {
    const series = [
      day(D0, 6_000_000),
      day(D1, 10_000),
      day(D2, 6_000_000),
    ];
    const { patches } = computeSvbumFakeStockPatchesForSeries(
      "svbum-1",
      series,
      D1,
      D2
    );
    expect(patches).toEqual([
      { productId: "svbum-1", dateMs: D1, from: 10_000, to: 0 },
      { productId: "svbum-1", dateMs: D2, from: 6_000_000, to: 0 },
    ]);
  });

  it("zeros -1 between spikes", () => {
    const series = [
      day(D0, 6_000_000),
      day(D1, -1),
      day(D2, 6_000_000),
    ];
    const { patches } = computeSvbumFakeStockPatchesForSeries(
      "svbum-1",
      series,
      D0,
      D2
    );
    expect(patches).toEqual([
      { productId: "svbum-1", dateMs: D0, from: 6_000_000, to: 0 },
      { productId: "svbum-1", dateMs: D1, from: -1, to: 0 },
      { productId: "svbum-1", dateMs: D2, from: 6_000_000, to: 0 },
    ]);
  });

  it("skips already-zero stock", () => {
    const series = [
      day(D0, 6_000_000),
      day(D1, 0),
      day(D2, 6_000_000),
    ];
    const { patches } = computeSvbumFakeStockPatchesForSeries(
      "svbum-1",
      series,
      D0,
      D2
    );
    expect(patches).toEqual([
      { productId: "svbum-1", dateMs: D0, from: 6_000_000, to: 0 },
      { productId: "svbum-1", dateMs: D2, from: 6_000_000, to: 0 },
    ]);
  });
});

describe("computeSvbumFakeStockPatches", () => {
  it("aggregates across productIds", () => {
    const map = new Map<string, SvbumStockDay[]>([
      ["a", [day(D0, 1_000_000), day(D1, 10), day(D2, 1_000_000)]],
      ["b", [day(D0, 50), day(D1, 50), day(D2, 50), day(D3, 50), day(D4, 2_000_000)]],
    ]);
    // b has trailing spike at end with 0 days after — no patch for b
    const { patches } = computeSvbumFakeStockPatches(map, D0, D4, 2);
    expect(patches.map((p) => p.productId).sort()).toEqual(["a", "a", "a"]);
  });
});
