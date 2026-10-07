import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuSliceMonth } from "../SkuSliceMonth.js";

describe("SkuSliceMonth Model", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
  });

  it("requires konkName, productId, month", async () => {
    const missing = new SkuSliceMonth({
      konkName: "air",
      productId: "air-1",
    });
    await expect(missing.save()).rejects.toThrow();
  });

  it("persists month doc with multiple day keys including sentinel -1", async () => {
    const month = new Date("2026-10-01T00:00:00.000Z");
    const saved = await SkuSliceMonth.create({
      konkName: "air",
      productId: "air-1",
      month,
      days: {
        "2026-10-01": { stock: 10, price: 5 },
        "2026-10-07": { stock: -1, price: -1 },
      },
    });
    expect(saved.konkName).toBe("air");
    expect(saved.productId).toBe("air-1");
    expect(saved.month.toISOString()).toBe(month.toISOString());
    expect(saved.days["2026-10-01"]).toEqual({ stock: 10, price: 5 });
    expect(saved.days["2026-10-07"]).toEqual({ stock: -1, price: -1 });
  });

  it("defaults days to empty object", async () => {
    const saved = await SkuSliceMonth.create({
      konkName: "air",
      productId: "air-2",
      month: new Date("2026-09-01T00:00:00.000Z"),
    });
    expect(saved.days).toEqual({});
  });

  it("enforces unique (konkName, productId, month)", async () => {
    const month = new Date("2026-10-01T00:00:00.000Z");
    await SkuSliceMonth.create({
      konkName: "dup",
      productId: "p1",
      month,
      days: {},
    });

    await expect(
      SkuSliceMonth.create({
        konkName: "dup",
        productId: "p1",
        month,
        days: { "2026-10-01": { stock: 1, price: 1 } },
      }),
    ).rejects.toThrow();
  });
});
