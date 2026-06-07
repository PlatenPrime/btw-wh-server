import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { BtradeSlice } from "../../models/BtradeSlice.js";
import {
  aggregateBtradeSlices,
  sliceDataProjectForArtikulList,
} from "../btradeSliceAggregationStages.js";

describe("btradeSliceAggregationStages", () => {
  beforeEach(async () => {
    await BtradeSlice.deleteMany({});
  });

  it("sliceDataProjectForArtikulList filters data keys", async () => {
    const date = new Date("2025-03-01T00:00:00.000Z");
    await BtradeSlice.create({
      date,
      data: {
        "ART-1": { price: 100, quantity: 5 },
        "ART-2": { price: 200, quantity: 10 },
        "ART-3": { price: 300, quantity: 15 },
      },
    });

    const pipeline = [
      { $match: { date } },
      sliceDataProjectForArtikulList(["ART-1", "ART-3"]),
    ];

    const result = await aggregateBtradeSlices(pipeline);

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual({
      "ART-1": { price: 100, quantity: 5 },
      "ART-3": { price: 300, quantity: 15 },
    });
  });

  it("aggregateBtradeSlices returns empty array when no matches", async () => {
    const result = await aggregateBtradeSlices([
      { $match: { date: new Date("2099-01-01T00:00:00.000Z") } },
    ]);

    expect(result).toEqual([]);
  });
});
