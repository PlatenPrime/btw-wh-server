import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuManufacturerDaySales } from "../SkuManufacturerDaySales.js";

describe("SkuManufacturerDaySales model", () => {
  beforeEach(async () => {
    await SkuManufacturerDaySales.deleteMany({});
  });

  it("persists konk/date/prodName totals", async () => {
    const date = new Date("2026-07-01T00:00:00.000Z");
    const saved = await SkuManufacturerDaySales.create({
      konkName: "balun",
      date,
      prodName: "Maker",
      salesPcs: 10,
      salesUah: 123.45,
    });
    expect(saved.konkName).toBe("balun");
    expect(saved.prodName).toBe("Maker");
    expect(saved.salesPcs).toBe(10);
    expect(saved.salesUah).toBe(123.45);
  });

  it("enforces unique (konkName, date, prodName)", async () => {
    const date = new Date("2026-07-02T00:00:00.000Z");
    await SkuManufacturerDaySales.create({
      konkName: "k",
      date,
      prodName: "p",
      salesPcs: 1,
      salesUah: 1,
    });
    await expect(
      SkuManufacturerDaySales.create({
        konkName: "k",
        date,
        prodName: "p",
        salesPcs: 2,
        salesUah: 2,
      }),
    ).rejects.toThrow();
  });
});
