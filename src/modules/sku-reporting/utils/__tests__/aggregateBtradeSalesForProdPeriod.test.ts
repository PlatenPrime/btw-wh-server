import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { BtradeManufacturerDaySales } from "../../models/BtradeManufacturerDaySales.js";
import { aggregateBtradeSalesForProdPeriod } from "../aggregateBtradeSalesForProdPeriod.js";

describe("aggregateBtradeSalesForProdPeriod", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeManufacturerDaySales.deleteMany({});
  });

  it("returns ok false when no arts for prod", async () => {
    const result = await aggregateBtradeSalesForProdPeriod({
      prod: "missing",
      dateFrom: new Date("2026-09-01T00:00:00.000Z"),
      dateTo: new Date("2026-09-02T00:00:00.000Z"),
    });
    expect(result.ok).toBe(false);
  });

  it("sums sales and revenue from rollup for matching prod", async () => {
    const prod = "bt-prod";
    const d1 = new Date("2026-09-01T00:00:00.000Z");
    const d2 = new Date("2026-09-02T00:00:00.000Z");

    await Art.create({ artikul: "BT-AGG-1", prodName: prod, zone: "Z" });
    await BtradeManufacturerDaySales.insertMany([
      { date: d1, prodName: prod.toLowerCase(), salesPcs: 5, salesUah: 50 },
      { date: d2, prodName: prod.toLowerCase(), salesPcs: 5, salesUah: 50 },
    ]);

    const result = await aggregateBtradeSalesForProdPeriod({
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.salesPcs).toBe(10);
    expect(result.salesUah).toBe(100);
  });

  it("matches prod case-insensitively", async () => {
    const d1 = new Date("2026-09-01T00:00:00.000Z");
    await Art.create({ artikul: "X", prodName: "Gemar", zone: "Z" });
    await BtradeManufacturerDaySales.create({
      date: d1,
      prodName: "gemar",
      salesPcs: 3,
      salesUah: 9,
    });

    const result = await aggregateBtradeSalesForProdPeriod({
      prod: "GEMAR",
      dateFrom: d1,
      dateTo: d1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.salesPcs).toBe(3);
  });

  it("filters by prodNamesLower when provided", async () => {
    const d1 = new Date("2026-09-01T00:00:00.000Z");
    await Art.insertMany([
      { artikul: "BT-KEEP", prodName: "KeepProd", zone: "Z" },
      { artikul: "BT-DROP", prodName: "DropProd", zone: "Z" },
    ]);
    await BtradeManufacturerDaySales.insertMany([
      { date: d1, prodName: "keepprod", salesPcs: 5, salesUah: 25 },
      { date: d1, prodName: "dropprod", salesPcs: 10, salesUah: 50 },
    ]);

    const result = await aggregateBtradeSalesForProdPeriod({
      dateFrom: d1,
      dateTo: d1,
      prodNamesLower: ["keepprod"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.salesPcs).toBe(5);
    expect(result.salesUah).toBe(25);
  });
});
