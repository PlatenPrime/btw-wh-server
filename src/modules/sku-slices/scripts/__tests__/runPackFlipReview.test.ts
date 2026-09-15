import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { SkuSlice } from "../../models/SkuSlice.js";
import {
  executePackFlipReviewCli,
  resolvePackFlipCliDates,
  runPackFlipReviewConnected,
} from "../runPackFlipReview.js";

describe("resolvePackFlipCliDates", () => {
  it("uses explicit from/to range", () => {
    const parsed = resolvePackFlipCliDates([
      "--from",
      "2026-09-11",
      "--to",
      "2026-09-13",
    ]);
    expect(parsed.apply).toBe(false);
    expect(parsed.konkName).toBe("perfect");
    expect(parsed.dates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
  });

  it("defaults to 7 days when flags omitted", () => {
    vi.useFakeTimers({ now: new Date("2026-09-15T10:00:00.000Z") });
    try {
      const parsed = resolvePackFlipCliDates(["--apply"]);
      expect(parsed.apply).toBe(true);
      expect(parsed.konkName).toBe("perfect");
      expect(parsed.dates).toHaveLength(7);
      expect(parsed.dates[0]!.toISOString().slice(0, 10)).toBe("2026-09-09");
      expect(parsed.dates[6]!.toISOString().slice(0, 10)).toBe("2026-09-15");
    } finally {
      vi.useRealTimers();
    }
  });

  it("forwards --konk", () => {
    const parsed = resolvePackFlipCliDates([
      "--from",
      "2026-09-11",
      "--to",
      "2026-09-11",
      "--konk",
      "air",
    ]);
    expect(parsed.konkName).toBe("air");
    expect(parsed.dates).toHaveLength(1);
  });
});

describe("executePackFlipReviewCli", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
    vi.restoreAllMocks();
  });

  it("prints JSON and applies patches when --apply", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const d0 = new Date("2026-09-13T00:00:00.000Z");
    const d1 = new Date("2026-09-14T00:00:00.000Z");
    const d2 = new Date("2026-09-15T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "perfect",
      date: d0,
      data: { "perfect-1": { stock: 100, price: 100 } },
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: d1,
      data: { "perfect-1": { stock: 10000, price: 1 } },
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: d2,
      data: { "perfect-1": { stock: 100, price: 100 } },
    });

    const result = await executePackFlipReviewCli([
      "--from",
      "2026-09-13",
      "--to",
      "2026-09-15",
      "--apply",
    ]);

    expect(result.patched).toHaveLength(1);
    expect(log).toHaveBeenCalledOnce();
    const mid = await SkuSlice.findOne({ konkName: "perfect", date: d1 }).lean();
    expect(mid?.data["perfect-1"]).toEqual({ stock: 100, price: 100 });
  });
});

describe("runPackFlipReviewConnected", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects and disconnects even when cli args are invalid", async () => {
    const connect = vi
      .spyOn(mongoose, "connect")
      .mockResolvedValue(mongoose as never);
    const disconnect = vi
      .spyOn(mongoose, "disconnect")
      .mockResolvedValue(undefined);

    await expect(runPackFlipReviewConnected(["--wat"])).rejects.toThrow(
      /Unknown argument/
    );
    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
