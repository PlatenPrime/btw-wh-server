import { describe, expect, it } from "vitest";
import { detectBandSpikeExits } from "../detectBandSpikeExits.js";
import type { RtlBandStockDay } from "../computeRtlBandSpikePatches.js";

const D0 = Date.UTC(2026, 8, 1);
const DAY = 24 * 60 * 60 * 1000;

function series(stocks: (number | undefined)[]): RtlBandStockDay[] {
  return stocks.map((stock, i) => ({ dateMs: D0 + i * DAY, stock }));
}

describe("detectBandSpikeExits", () => {
  it("returns run that was in band then exited", () => {
    const s = series([5, 9937, 9937, 59]);
    const runs = detectBandSpikeExits(s, s[0]!.dateMs, s[3]!.dateMs, 9000, 11000);
    expect(runs).toEqual([
      {
        dateFromMs: s[1]!.dateMs,
        dateToMs: s[2]!.dateMs,
        peakStock: 9937,
      },
    ]);
  });

  it("includes run that starts already in band then exits", () => {
    const s = series([10000, 10000, 40]);
    const runs = detectBandSpikeExits(s, s[0]!.dateMs, s[2]!.dateMs, 9000, 11000);
    expect(runs).toEqual([
      {
        dateFromMs: s[0]!.dateMs,
        dateToMs: s[1]!.dateMs,
        peakStock: 10000,
      },
    ]);
  });

  it("does not return trailing in-band run without exit", () => {
    const s = series([5, 9937, 9937]);
    const runs = detectBandSpikeExits(s, s[0]!.dateMs, s[2]!.dateMs, 9000, 11000);
    expect(runs).toEqual([]);
  });

  it("does not return flat series never in band", () => {
    const s = series([5, 10, 12, 8]);
    expect(detectBandSpikeExits(s, s[0]!.dateMs, s[3]!.dateMs, 9000, 11000)).toEqual([]);
  });

  it("returns multiple exited runs independently", () => {
    const s = series([1, 9937, 1, 2, 9940, 2]);
    const runs = detectBandSpikeExits(s, s[0]!.dateMs, s[5]!.dateMs, 9000, 11000);
    expect(runs).toEqual([
      { dateFromMs: s[1]!.dateMs, dateToMs: s[1]!.dateMs, peakStock: 9937 },
      { dateFromMs: s[4]!.dateMs, dateToMs: s[4]!.dateMs, peakStock: 9940 },
    ]);
  });

  it("ignores exit day that is still in band (impossible contiguous split)", () => {
    // findBandRuns merges contiguous in-band; exit must be outside band
    const s = series([5, 9937, 10000, 50]);
    const runs = detectBandSpikeExits(s, s[1]!.dateMs, s[2]!.dateMs, 9000, 11000);
    expect(runs).toEqual([
      {
        dateFromMs: s[1]!.dateMs,
        dateToMs: s[2]!.dateMs,
        peakStock: 10000,
      },
    ]);
  });

  it("works with million-scale svbum band", () => {
    const s = series([100, 1_200_000, 80]);
    const runs = detectBandSpikeExits(s, s[0]!.dateMs, s[2]!.dateMs, 900_000, 9_999_999);
    expect(runs).toEqual([
      {
        dateFromMs: s[1]!.dateMs,
        dateToMs: s[1]!.dateMs,
        peakStock: 1_200_000,
      },
    ]);
  });
});
