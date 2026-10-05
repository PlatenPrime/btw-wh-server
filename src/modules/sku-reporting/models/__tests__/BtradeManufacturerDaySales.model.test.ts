import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { BtradeManufacturerDaySales } from "../BtradeManufacturerDaySales.js";

describe("BtradeManufacturerDaySales model", () => {
  beforeEach(async () => {
    await BtradeManufacturerDaySales.deleteMany({});
  });

  it("persists date/prodName totals", async () => {
    const date = new Date("2026-07-01T00:00:00.000Z");
    const saved = await BtradeManufacturerDaySales.create({
      date,
      prodName: "gemar",
      salesPcs: 10,
      salesUah: 50,
    });
    expect(saved.prodName).toBe("gemar");
    expect(saved.salesPcs).toBe(10);
  });

  it("enforces unique (date, prodName)", async () => {
    const date = new Date("2026-07-02T00:00:00.000Z");
    await BtradeManufacturerDaySales.create({
      date,
      prodName: "gemar",
      salesPcs: 1,
      salesUah: 1,
    });
    await expect(
      BtradeManufacturerDaySales.create({
        date,
        prodName: "gemar",
        salesPcs: 2,
        salesUah: 2,
      }),
    ).rejects.toThrow();
  });
});
