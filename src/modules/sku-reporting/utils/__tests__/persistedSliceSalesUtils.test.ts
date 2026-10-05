import { beforeEach, describe, expect, it } from "vitest";
import {
  computePersistedDaySales,
  toMetricForPersistedSales,
} from "../persistedSliceSalesUtils.js";

describe("persistedSliceSalesUtils", () => {
  const day = new Date("2026-06-02T00:00:00.000Z");

  it("maps -1 and non-finite to null for sales metrics", () => {
    expect(toMetricForPersistedSales(-1)).toBeNull();
    expect(toMetricForPersistedSales(NaN)).toBeNull();
    expect(toMetricForPersistedSales(10)).toBe(10);
  });

  it("zeros sales when curr stock is -1 (does not yield 11 from [10,-1])", () => {
    expect(
      computePersistedDaySales({
        prevStockRaw: 10,
        currStockRaw: -1,
        currPriceRaw: 5,
        date: day,
      }),
    ).toEqual({ salesPcs: 0, salesUah: 0, isDeliveryDay: false });
  });

  it("zeros sales when prev stock is -1", () => {
    expect(
      computePersistedDaySales({
        prevStockRaw: -1,
        currStockRaw: 8,
        currPriceRaw: 5,
        date: day,
      }),
    ).toEqual({ salesPcs: 0, salesUah: 0, isDeliveryDay: false });
  });

  it("computes drop as sales and revenue from valid pair", () => {
    expect(
      computePersistedDaySales({
        prevStockRaw: 10,
        currStockRaw: 7,
        currPriceRaw: 12.5,
        date: day,
      }),
    ).toEqual({ salesPcs: 3, salesUah: 37.5, isDeliveryDay: false });
  });

  it("zeros sales on delivery day (stock rose)", () => {
    expect(
      computePersistedDaySales({
        prevStockRaw: 5,
        currStockRaw: 12,
        currPriceRaw: 10,
        date: day,
      }),
    ).toEqual({ salesPcs: 0, salesUah: 0, isDeliveryDay: true });
  });

  it("applies recountDays after delta", () => {
    const recountDays = new Set(["2026-06-02"]);
    expect(
      computePersistedDaySales({
        prevStockRaw: 10,
        currStockRaw: 7,
        currPriceRaw: 12.5,
        date: day,
        recountDays,
      }),
    ).toEqual({ salesPcs: 0, salesUah: 0, isDeliveryDay: false });
  });

  it("treats price -1 as zero revenue", () => {
    expect(
      computePersistedDaySales({
        prevStockRaw: 10,
        currStockRaw: 7,
        currPriceRaw: -1,
        date: day,
      }),
    ).toEqual({ salesPcs: 3, salesUah: 0, isDeliveryDay: false });
  });
});
