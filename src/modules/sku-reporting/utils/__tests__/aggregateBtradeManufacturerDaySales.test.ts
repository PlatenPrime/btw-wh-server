import { beforeEach, describe, expect, it } from "vitest";
import { BtradeManufacturerDaySales } from "../../models/BtradeManufacturerDaySales.js";
import {
  dailyBtradeManufacturerSales,
  sumBtradeManufacturerSalesForPeriod,
} from "../aggregateBtradeManufacturerDaySales.js";

describe("aggregateBtradeManufacturerDaySales", () => {
  const d1 = new Date("2026-07-01T00:00:00.000Z");
  const d2 = new Date("2026-07-02T00:00:00.000Z");
  const d3 = new Date("2026-07-03T00:00:00.000Z");

  beforeEach(async () => {
    await BtradeManufacturerDaySales.deleteMany({});
  });

  it("sumBtradeManufacturerSalesForPeriod sums selected prods", async () => {
    await BtradeManufacturerDaySales.insertMany([
      { date: d1, prodName: "gemar", salesPcs: 2, salesUah: 10 },
      { date: d2, prodName: "gemar", salesPcs: 3, salesUah: 15 },
      { date: d1, prodName: "other", salesPcs: 9, salesUah: 9 },
    ]);
    const r = await sumBtradeManufacturerSalesForPeriod({
      dateFrom: d1,
      dateTo: d2,
      prodNamesLower: ["gemar"],
    });
    expect(r).toEqual({ salesPcs: 5, salesUah: 25 });
  });

  it("dailyBtradeManufacturerSales fills gaps", async () => {
    await BtradeManufacturerDaySales.insertMany([
      { date: d1, prodName: "gemar", salesPcs: 2, salesUah: 10 },
      { date: d3, prodName: "gemar", salesPcs: 4, salesUah: 20 },
    ]);
    const rows = await dailyBtradeManufacturerSales({
      dateFrom: d1,
      dateTo: d3,
      prodName: "gemar",
    });
    expect(rows.map((r) => r.salesPcs)).toEqual([2, 0, 4]);
  });

  it("dailyBtradeManufacturerSales prod=all sums manufacturers", async () => {
    await BtradeManufacturerDaySales.insertMany([
      { date: d1, prodName: "a", salesPcs: 2, salesUah: 2 },
      { date: d1, prodName: "b", salesPcs: 3, salesUah: 3 },
    ]);
    const rows = await dailyBtradeManufacturerSales({
      dateFrom: d1,
      dateTo: d1,
      prodName: "all",
    });
    expect(rows).toEqual([{ date: d1, salesPcs: 5, salesUah: 5 }]);
  });
});
