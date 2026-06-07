import { beforeEach, describe, expect, it } from "vitest";
import { SkuSlice } from "../../models/SkuSlice.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForProductIdList,
  sliceDataProjectForSingleProductId,
} from "../sliceDataAggregationStages.js";

describe("sliceDataAggregationStages", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
  });

  it("sliceDataProjectForSingleProductId returns pipeline stage shape", () => {
    const stage = sliceDataProjectForSingleProductId("air-1");
    expect(stage).toHaveProperty("$project");
    expect((stage as { $project: Record<string, unknown> }).$project.date).toBe(1);
  });

  it("sliceDataProjectForProductIdList includes konkName in projection", () => {
    const stage = sliceDataProjectForProductIdList(["a", "b"]);
    expect((stage as { $project: Record<string, unknown> }).$project.konkName).toBe(1);
  });

  it("aggregateSkuSlices filters data to single productId", async () => {
    const date = new Date("2026-05-01T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "agg-k",
      date,
      data: {
        "agg-k-1": { stock: 5, price: 10 },
        "agg-k-2": { stock: 9, price: 11 },
      },
    });

    const rows = await aggregateSkuSlices([
      { $match: { konkName: "agg-k", date } },
      sliceDataProjectForSingleProductId("agg-k-1"),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.data).toEqual({ "agg-k-1": { stock: 5, price: 10 } });
  });

  it("aggregateSkuSlices filters data to product id list", async () => {
    const date = new Date("2026-05-02T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "agg-k2",
      date,
      data: {
        "p1": { stock: 1, price: 2 },
        "p2": { stock: 3, price: 4 },
        "p3": { stock: 5, price: 6 },
      },
    });

    const rows = await aggregateSkuSlices([
      { $match: { konkName: "agg-k2", date } },
      sliceDataProjectForProductIdList(["p1", "p3"]),
    ]);

    expect(rows[0]!.data).toEqual({
      p1: { stock: 1, price: 2 },
      p3: { stock: 5, price: 6 },
    });
  });
});
