import { describe, expect, it } from "vitest";
import {
  computeRtlBandSpikePatches,
  isManualBandStock,
  isManualSmallStock,
  type RtlBandStockDay,
} from "../computeRtlBandSpikePatches.js";

const D0 = Date.UTC(2026, 9, 15);
const DAY = 24 * 60 * 60 * 1000;
const BAND = { bandMin: 9000, bandMax: 11000 };

function day(offset: number, stock: number | undefined): RtlBandStockDay {
  return { dateMs: D0 + offset * DAY, stock };
}

function series(stocks: (number | undefined)[]): RtlBandStockDay[] {
  return stocks.map((stock, i) => day(i, stock));
}

describe("isManualBandStock / isManualSmallStock", () => {
  it("treats band as inclusive", () => {
    expect(isManualBandStock(9000, 9000, 11000)).toBe(true);
    expect(isManualBandStock(9937, 9000, 11000)).toBe(true);
    expect(isManualBandStock(11000, 9000, 11000)).toBe(true);
    expect(isManualBandStock(8999, 9000, 11000)).toBe(false);
    expect(isManualBandStock(11001, 9000, 11000)).toBe(false);
  });

  it("treats stock below band as small (not -1)", () => {
    expect(isManualSmallStock(0, 9000)).toBe(true);
    expect(isManualSmallStock(59, 9000)).toBe(true);
    expect(isManualSmallStock(8999, 9000)).toBe(true);
    expect(isManualSmallStock(9000, 9000)).toBe(false);
    expect(isManualSmallStock(-1, 9000)).toBe(false);
  });
});

describe("computeRtlBandSpikePatches", () => {
  it("flattens flat spike 0→9937×N→59 to right anchor", () => {
    const s = series([0, 9937, 9937, 9937, 59]);
    const windowStart = s[1]!.dateMs;
    const windowEnd = s[3]!.dateMs;
    const { patches, skipped } = computeRtlBandSpikePatches(s, windowStart, windowEnd, BAND);

    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9937, to: 59 },
      { dateMs: s[2]!.dateMs, from: 9937, to: 59 },
      { dateMs: s[3]!.dateMs, from: 9937, to: 59 },
    ]);
  });

  it("preserves intra-band sales walking RTL", () => {
    const s = series([50, 9937, 9927, 9917, 50]);
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[1]!.dateMs, s[3]!.dateMs, BAND);

    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9937, to: 70 },
      { dateMs: s[2]!.dateMs, from: 9927, to: 60 },
      { dateMs: s[3]!.dateMs, from: 9917, to: 50 },
    ]);
  });

  it("skips when right neighbor is missing", () => {
    const s = series([50, 9937, 9927, undefined]);
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs, BAND);

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
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs, BAND);

    expect(patches).toEqual([]);
    expect(skipped[0]?.reason).toBe("not-sandwich-left");
  });

  it("skips when right neighbor is not small", () => {
    const s = series([50, 9937, 9927, 9500]);
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs, BAND);

    expect(patches).toEqual([]);
    expect(skipped[0]?.reason).toBe("not-sandwich-right");
  });

  it("skips when left neighbor is missing", () => {
    const s = series([undefined, 9937, 50]);
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[1]!.dateMs, s[1]!.dateMs, BAND);

    expect(patches).toEqual([]);
    expect(skipped[0]?.reason).toBe("missing-left");
  });

  it("returns empty when window has no band days", () => {
    const s = series([50, 60, 70, 50]);
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[0]!.dateMs, s[3]!.dateMs, BAND);
    expect(patches).toEqual([]);
    expect(skipped).toEqual([]);
  });

  it("respects custom band for high spikes", () => {
    const s = series([10, 1_500_000, 1_500_000, 12]);
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs, {
      bandMin: 900_000,
      bandMax: 9_999_999,
    });
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 1_500_000, to: 12 },
      { dateMs: s[2]!.dateMs, from: 1_500_000, to: 12 },
    ]);
  });

  it("handles growth inside band as zero sales contribution", () => {
    const s = series([5, 9900, 9990, 5]);
    const { patches } = computeRtlBandSpikePatches(s, s[1]!.dateMs, s[2]!.dateMs, BAND);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9900, to: 5 },
      { dateMs: s[2]!.dateMs, from: 9990, to: 5 },
    ]);
  });

  it("patches multiple sandwich runs independently", () => {
    const s = series([1, 9937, 1, 2, 9940, 2]);
    const { patches, skipped } = computeRtlBandSpikePatches(s, s[0]!.dateMs, s[5]!.dateMs, BAND);
    expect(skipped).toEqual([]);
    expect(patches).toEqual([
      { dateMs: s[1]!.dateMs, from: 9937, to: 1 },
      { dateMs: s[4]!.dateMs, from: 9940, to: 2 },
    ]);
  });
});
