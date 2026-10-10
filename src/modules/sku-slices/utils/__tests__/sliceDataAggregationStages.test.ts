import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { seedSkuSliceMonthDay } from "../seedSkuSliceMonthDay.js";
import {
  aggregateSkuSlices,
  loadSkuSliceRowsForKonksProducts,
  loadSkuSliceRowsForProduct,
  sliceDataProjectForProductIdList,
  sliceDataProjectForSingleProductId,
} from "../sliceDataAggregationStages.js";

describe("sliceDataAggregationStages", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
  });

  it("sliceDataProject helpers keep legacy shape", () => {
    expect(sliceDataProjectForSingleProductId("air-1").$project).toBeDefined();
    expect(sliceDataProjectForProductIdList(["a", "b"]).$project.konkName).toBe(
      1,
    );
  });

  it("loadSkuSliceRowsForProduct returns day rows", async () => {
    const d = new Date("2026-10-09T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", d, {
      "agg-k-1": { stock: 3, price: 4 },
      other: { stock: 9, price: 9 },
    });
    const rows = await loadSkuSliceRowsForProduct(
      "air",
      "agg-k-1",
      d,
      d,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toEqual({ "agg-k-1": { stock: 3, price: 4 } });
  });

  it("loadSkuSliceRowsForKonksProducts filters to requested skus", async () => {
    const d = new Date("2026-10-09T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", d, {
      p1: { stock: 1, price: 1 },
      p2: { stock: 2, price: 2 },
      p3: { stock: 3, price: 3 },
    });
    const rows = await loadSkuSliceRowsForKonksProducts(
      [
        { konkName: "air", productId: "p1" },
        { konkName: "air", productId: "p3" },
      ],
      d,
      d,
    );
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]!.data!).sort()).toEqual(["p1", "p3"]);
  });

  it("aggregateSkuSlices shim loads from months", async () => {
    const d = new Date("2026-10-09T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", d, { x: { stock: 1, price: 2 } });
    const rows = await aggregateSkuSlices([
      { $match: { konkName: "air", date: d } },
    ]);
    expect(rows).toHaveLength(1);
    expect((rows[0] as { data?: Record<string, unknown> }).data).toEqual({
      x: { stock: 1, price: 2 },
    });
  });
});
