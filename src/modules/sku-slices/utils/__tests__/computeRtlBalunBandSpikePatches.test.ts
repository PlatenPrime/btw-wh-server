import { describe, expect, it } from "vitest";
import {
  computeRtlBalunBandSpikePatches,
  isBalunManualBandStock,
  isBalunManualSmallStock,
  type RtlBandStockDay,
} from "../computeRtlBalunBandSpikePatches.js";

const D0 = Date.UTC(2026, 9, 15);
const DAY = 24 * 60 * 60 * 1000;

function day(offset: number, stock: number | undefined): RtlBandStockDay {
  return { dateMs: D0 + offset * DAY, stock };
}

function series(stocks: (number | undefined)[]): RtlBandStockDay[] {
  return stocks.map((stock, i) => day(i, stock));
}

describe("isBalunManualBandStock / isBalunManualSmallStock", () => {
  it("treats 9000–11000 as band inclusive", () => {
    expect(isBalunManualBandStock(9000)).toBe(true);
    expect(isBalunManualBandStock(9937)).toBe(true);
    expect(isBalunManualBandStock(9950)).toBe(true);
    expect(isBalunManualBandStock(10000)).toBe(true);
    expect(isBalunManualBandStock(11000)).toBe(true);
    expect(isBalunManualBandStock(8999)).toBe(false);
    expect(isBalunManualBandStock(11001)).toBe(false);
  });

  it("treats stock below band as small (not -1)", () => {
    expect(isBalunManualSmallStock(0)).toBe(true);
    expect(isBalunManualSmallStock(59)).toBe(true);
    expect(isBalunManualSmallStock(8999)).toBe(true);
    expect(isBalunManualSmallStock(9000)).toBe(false);
    expect(isBalunManualSmallStock(-1)).toBe(false);
  });
});

describe("computeRtlBalunBandSpikePatches", () => {
  it("flattens flat spike 0→9937×N→59 to right anchor", () => {
    const s = series([0, 9937, 9937, 9937, 59]);
    const windowStart = s[1]!.dateMs;
    const windowEnd = s[3]!.dateMs;
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, windowStart, windowEnd);

    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9937, to: 59 },
      { dateMs: s[2]!.dateMs, from: 9937, to: 59 },
      { dateMs: s[3]!.dateMs, from: 9937, to: 59 },
    ]);
  });

  it("preserves intra-band sales walking RTL", () => {
    // raw: [50, 9937, 9927, 9917, 50] → corrected band: [70, 60, 50]
    const s = series([50, 9937, 9927, 9917, 50]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[1]!.dateMs, s[3]!.dateMs);

    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9937, to: 70 },
      { dateMs: s[2]!.dateMs, from: 9927, to: 60 },
      { dateMs: s[3]!.dateMs, from: 9917, to: 50 },
    ]);
  });

  it("skips when right neighbor is missing", () => {
    const s = series([50, 9937, 9927, undefined]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs);

    expect(patches).toEqual([]);
    expect(skipped).toEqual([
      {
        dateFromMs: s[1]!.dateMs,
        dateToMs: s[2]!.dateMs,
        reason: "missing-right",
      },
    ]);
  });

  it("skips when left neighbor is not small", () => {
    const s = series([9500, 9937, 9927, 50]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs);

    expect(patches).toEqual([]);
    expect(skipped[0]?.reason).toBe("not-sandwich-left");
  });

  it("skips when right neighbor is not small", () => {
    const s = series([50, 9937, 9927, 9500]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs);

    expect(patches).toEqual([]);
    expect(skipped[0]?.reason).toBe("not-sandwich-right");
  });

  it("skips when left neighbor is missing", () => {
    const s = series([undefined, 9937, 50]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[1]!.dateMs, s[1]!.dateMs);

    expect(patches).toEqual([]);
    expect(skipped[0]?.reason).toBe("missing-left");
  });

  it("returns empty when window has no band days", () => {
    const s = series([50, 60, 70, 50]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[0]!.dateMs, s[3]!.dateMs);
    expect(patches).toEqual([]);
    expect(skipped).toEqual([]);
  });

  it("patches 9950 via manual band while still in range", () => {
    const s = series([10, 9950, 9950, 12]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs);
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9950, to: 12 },
      { dateMs: s[2]!.dateMs, from: 9950, to: 12 },
    ]);
  });

  it("handles growth inside band as zero sales contribution", () => {
    // 9900 → 9990 growth LTR (both in band): RTL sales from 9900 to 9990 = 0
    const s = series([5, 9900, 9990, 5]);
    const { patches } = computeRtlBalunBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9900, to: 5 },
      { dateMs: s[2]!.dateMs, from: 9990, to: 5 },
    ]);
  });

  it("patches multiple sandwich runs independently", () => {
    const s = series([1, 9937, 1, 2, 9940, 2]);
    const { patches, skipped } = computeRtlBalunBandSpikePatches(s, s[0]!.dateMs, s[5]!.dateMs);
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9937, to: 1 },
      { dateMs: s[4]!.dateMs, from: 9940, to: 2 },
    ]);
  });
});
