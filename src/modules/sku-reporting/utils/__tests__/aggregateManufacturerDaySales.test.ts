import { beforeEach, describe, expect, it } from "vitest";
import { SkuManufacturerDaySales } from "../../models/SkuManufacturerDaySales.js";
import {
  dailyManufacturerSales,
  sumManufacturerSalesByKonkName,
  sumManufacturerSalesByProdName,
} from "../aggregateManufacturerDaySales.js";

describe("aggregateManufacturerDaySales", () => {
  const d1 = new Date("2026-07-01T00:00:00.000Z");
  const d2 = new Date("2026-07-02T00:00:00.000Z");
  const d3 = new Date("2026-07-03T00:00:00.000Z");

  beforeEach(async () => {
    await SkuManufacturerDaySales.deleteMany({});
  });

  it("sumManufacturerSalesByProdName groups period by prodName", async () => {
    await SkuManufacturerDaySales.insertMany([
      {
        konkName: "k",
        date: d1,
        prodName: "A",
        salesPcs: 2,
        salesUah: 10,
      },
      {
        konkName: "k",
        date: d2,
        prodName: "A",
        salesPcs: 3,
        salesUah: 15,
      },
      {
        konkName: "k",
        date: d1,
        prodName: "B",
        salesPcs: 1,
        salesUah: 4,
      },
      {
        konkName: "other",
        date: d1,
        prodName: "A",
        salesPcs: 99,
        salesUah: 99,
      },
    ]);

    const rows = await sumManufacturerSalesByProdName({
      konkName: "k",
      dateFrom: d1,
      dateTo: d2,
    });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(byKey.A).toEqual({ key: "A", salesPcs: 5, salesUah: 25 });
    expect(byKey.B).toEqual({ key: "B", salesPcs: 1, salesUah: 4 });
  });

  it("sumManufacturerSalesByProdName filters prodNames", async () => {
    await SkuManufacturerDaySales.insertMany([
      { konkName: "k", date: d1, prodName: "A", salesPcs: 2, salesUah: 10 },
      { konkName: "k", date: d1, prodName: "B", salesPcs: 1, salesUah: 4 },
    ]);
    const rows = await sumManufacturerSalesByProdName({
      konkName: "k",
      dateFrom: d1,
      dateTo: d1,
      prodNames: ["B"],
    });
    expect(rows).toEqual([{ key: "B", salesPcs: 1, salesUah: 4 }]);
  });

  it("sumManufacturerSalesByKonkName groups period by konkName", async () => {
    await SkuManufacturerDaySales.insertMany([
      {
        konkName: "k1",
        date: d1,
        prodName: "P",
        salesPcs: 2,
        salesUah: 20,
      },
      {
        konkName: "k1",
        date: d2,
        prodName: "P",
        salesPcs: 1,
        salesUah: 10,
      },
      {
        konkName: "k2",
        date: d1,
        prodName: "P",
        salesPcs: 5,
        salesUah: 50,
      },
      {
        konkName: "k2",
        date: d1,
        prodName: "Other",
        salesPcs: 9,
        salesUah: 9,
      },
    ]);

    const rows = await sumManufacturerSalesByKonkName({
      prodName: "P",
      dateFrom: d1,
      dateTo: d2,
    });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(byKey.k1).toEqual({ key: "k1", salesPcs: 3, salesUah: 30 });
    expect(byKey.k2).toEqual({ key: "k2", salesPcs: 5, salesUah: 50 });
  });

  it("sumManufacturerSalesByKonkName matches prodName case-insensitively", async () => {
    await SkuManufacturerDaySales.create({
      konkName: "k1",
      date: d1,
      prodName: "Gemar",
      salesPcs: 2,
      salesUah: 10,
    });
    const rows = await sumManufacturerSalesByKonkName({
      prodName: "gemar",
      dateFrom: d1,
      dateTo: d1,
    });
    expect(rows).toEqual([{ key: "k1", salesPcs: 2, salesUah: 10 }]);
  });

  it("sumManufacturerSalesByKonkName excludes konkNames via $nin", async () => {
    await SkuManufacturerDaySales.insertMany([
      { konkName: "k1", date: d1, prodName: "P", salesPcs: 2, salesUah: 20 },
      { konkName: "k2", date: d1, prodName: "P", salesPcs: 5, salesUah: 50 },
      { konkName: "k3", date: d1, prodName: "P", salesPcs: 1, salesUah: 10 },
    ]);
    const rows = await sumManufacturerSalesByKonkName({
      prodName: "P",
      dateFrom: d1,
      dateTo: d1,
      excludeKonkNames: ["k2", "k3"],
    });
    expect(rows).toEqual([{ key: "k1", salesPcs: 2, salesUah: 20 }]);
  });


  it("dailyManufacturerSales fills missing days with zeros", async () => {
    await SkuManufacturerDaySales.insertMany([
      {
        konkName: "k",
        date: d1,
        prodName: "P",
        salesPcs: 2,
        salesUah: 10,
      },
      {
        konkName: "k",
        date: d3,
        prodName: "P",
        salesPcs: 4,
        salesUah: 20,
      },
    ]);

    const rows = await dailyManufacturerSales({
      konkName: "k",
      prodName: "P",
      dateFrom: d1,
      dateTo: d3,
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ salesPcs: 2, salesUah: 10 });
    expect(rows[1]).toMatchObject({ salesPcs: 0, salesUah: 0 });
    expect(rows[2]).toMatchObject({ salesPcs: 4, salesUah: 20 });
  });

  it("dailyManufacturerSales with prod=all sums manufacturers per day", async () => {
    await SkuManufacturerDaySales.insertMany([
      {
        konkName: "k",
        date: d1,
        prodName: "A",
        salesPcs: 2,
        salesUah: 10,
      },
      {
        konkName: "k",
        date: d1,
        prodName: "B",
        salesPcs: 3,
        salesUah: 6,
      },
    ]);

    const rows = await dailyManufacturerSales({
      konkName: "k",
      prodName: "all",
      dateFrom: d1,
      dateTo: d1,
    });
    expect(rows).toEqual([
      { date: d1, salesPcs: 5, salesUah: 16 },
    ]);
  });
});
