import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { SVBUM_FAKE_STOCK_CRON_DAYS_BACK } from "../../../slices/config/svbumFakeStockThreshold.js";
import {
  executeCorrectSvbumFakeStockCli,
  resolveCorrectSvbumFakeStockCliInput,
  runCorrectSvbumFakeStockConnected,
} from "../runCorrectSvbumFakeStock.js";
import { seedSkuSliceMonthDay } from "../../utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { getDayPoint } from "../../utils/skuSliceMonthStore.js";

describe("resolveCorrectSvbumFakeStockCliInput", () => {
  it("defaults to cron daysBack dry-run", () => {
    expect(resolveCorrectSvbumFakeStockCliInput([])).toEqual({
      daysBack: SVBUM_FAKE_STOCK_CRON_DAYS_BACK,
      apply: false,
    });
  });

  it("forwards days-back/as-of/apply/lookback-days", () => {
    expect(
      resolveCorrectSvbumFakeStockCliInput([
        "--days-back",
        "3",
        "--as-of",
        "2026-10-07",
        "--apply",
        "--lookback-days",
        "10",
      ])
    ).toEqual({
      daysBack: 3,
      asOf: new Date("2026-10-07T00:00:00.000Z"),
      apply: true,
      lookbackDays: 10,
    });
  });
});

describe("executeCorrectSvbumFakeStockCli", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
    vi.restoreAllMocks();
  });

  it("prints JSON and patches fake stock when --apply", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const d0 = new Date("2026-10-05T00:00:00.000Z");
    const d1 = new Date("2026-10-06T00:00:00.000Z");
    const d2 = new Date("2026-10-07T00:00:00.000Z");
    await seedSkuSliceMonthDay("svbum", d0, { "svbum-1": { stock: 6_000_000, price: 10 } });
    await seedSkuSliceMonthDay("svbum", d1, { "svbum-1": { stock: 10_000, price: 10 } });
    await seedSkuSliceMonthDay("svbum", d2, { "svbum-1": { stock: 6_000_000, price: 10 } });

    const result = await executeCorrectSvbumFakeStockCli([
      "--days-back",
      "3",
      "--as-of",
      "2026-10-07",
      "--apply",
    ]);

    expect(result.patched).toEqual([
      {
        productId: "svbum-1",
        date: "2026-10-05",
        from: 6_000_000,
        to: 0,
      },
      {
        productId: "svbum-1",
        date: "2026-10-06",
        from: 10_000,
        to: 0,
      },
      {
        productId: "svbum-1",
        date: "2026-10-07",
        from: 6_000_000,
        to: 0,
      },
    ]);
    expect(log).toHaveBeenCalledOnce();
    expect(await getDayPoint("svbum", "svbum-1", d1)).toEqual({ stock: 0, price: 10 });
  });

  it("dry-run does not write patches", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const d0 = new Date("2026-10-05T00:00:00.000Z");
    const d1 = new Date("2026-10-06T00:00:00.000Z");
    const d2 = new Date("2026-10-07T00:00:00.000Z");
    await seedSkuSliceMonthDay("svbum", d0, { "svbum-1": { stock: 6_000_000, price: 10 } });
    await seedSkuSliceMonthDay("svbum", d1, { "svbum-1": { stock: 10_000, price: 10 } });
    await seedSkuSliceMonthDay("svbum", d2, { "svbum-1": { stock: 6_000_000, price: 10 } });

    const result = await executeCorrectSvbumFakeStockCli([
      "--days-back",
      "3",
      "--as-of",
      "2026-10-07",
    ]);

    expect(result.apply).toBe(false);
    expect(result.patched).toHaveLength(3);
    expect(await getDayPoint("svbum", "svbum-1", d1)).toEqual({ stock: 10_000, price: 10 });
  });
});

describe("runCorrectSvbumFakeStockConnected", () => {
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

    await expect(runCorrectSvbumFakeStockConnected(["--wat"])).rejects.toThrow(
      /Unknown argument/
    );
    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
