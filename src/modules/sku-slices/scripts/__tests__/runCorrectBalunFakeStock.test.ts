import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { BALUN_FAKE_STOCK_CRON_DAYS_BACK } from "../../../slices/config/balunFakeStockSentinel.js";
import {
  executeCorrectBalunFakeStockCli,
  resolveCorrectBalunFakeStockCliInput,
  runCorrectBalunFakeStockConnected,
} from "../runCorrectBalunFakeStock.js";
import { seedSkuSliceMonthDay } from "../../utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { getDayPoint } from "../../utils/skuSliceMonthStore.js";

describe("resolveCorrectBalunFakeStockCliInput", () => {
  it("defaults to cron daysBack dry-run", () => {
    expect(resolveCorrectBalunFakeStockCliInput([])).toEqual({
      daysBack: BALUN_FAKE_STOCK_CRON_DAYS_BACK,
      apply: false,
    });
  });

  it("forwards days-back/as-of/apply/lookback-days", () => {
    expect(
      resolveCorrectBalunFakeStockCliInput([
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

describe("executeCorrectBalunFakeStockCli", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
    vi.restoreAllMocks();
  });

  it("prints JSON and patches fake stock when --apply", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const d0 = new Date("2026-10-05T00:00:00.000Z");
    const d1 = new Date("2026-10-06T00:00:00.000Z");
    const d2 = new Date("2026-10-07T00:00:00.000Z");
    await seedSkuSliceMonthDay("balun", d0, { "balun-1": { stock: -1, price: 10 } });
    await seedSkuSliceMonthDay("balun", d1, { "balun-1": { stock: 10000, price: 10 } });
    await seedSkuSliceMonthDay("balun", d2, { "balun-1": { stock: 3, price: 10 } });

    const result = await executeCorrectBalunFakeStockCli([
      "--days-back",
      "3",
      "--as-of",
      "2026-10-07",
      "--apply",
    ]);

    expect(result.patched).toEqual([
      {
        productId: "balun-1",
        date: "2026-10-06",
        from: 10000,
        to: 3,
      },
    ]);
    expect(log).toHaveBeenCalledOnce();
    expect(await getDayPoint("balun", "balun-1", d1)).toEqual({ stock: 3, price: 10 });
  });

  it("dry-run does not write patches", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const d1 = new Date("2026-10-06T00:00:00.000Z");
    const d2 = new Date("2026-10-07T00:00:00.000Z");
    await seedSkuSliceMonthDay("balun", d1, { "balun-1": { stock: 10000, price: 10 } });
    await seedSkuSliceMonthDay("balun", d2, { "balun-1": { stock: 3, price: 10 } });

    const result = await executeCorrectBalunFakeStockCli([
      "--days-back",
      "2",
      "--as-of",
      "2026-10-07",
    ]);

    expect(result.apply).toBe(false);
    expect(result.patched).toHaveLength(1);
    expect(await getDayPoint("balun", "balun-1", d1)).toEqual({ stock: 10000, price: 10 });
  });
});

describe("runCorrectBalunFakeStockConnected", () => {
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

    await expect(runCorrectBalunFakeStockConnected(["--wat"])).rejects.toThrow(
      /Unknown argument/
    );
    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
