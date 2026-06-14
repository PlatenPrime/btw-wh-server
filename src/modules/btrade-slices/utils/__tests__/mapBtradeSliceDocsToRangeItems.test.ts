import { describe, expect, it } from "vitest";
import { mapBtradeSliceDocsToRangeItems } from "../mapBtradeSliceDocsToRangeItems.js";

describe("mapBtradeSliceDocsToRangeItems", () => {
  it("maps only dates with artikul data", () => {
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const items = mapBtradeSliceDocsToRangeItems(
      [
        { date: d1, data: { "ART-1": { quantity: 1, price: 2 } } },
        { date: d2, data: { "ART-2": { quantity: 3, price: 4 } } },
      ],
      "ART-1",
    );
    expect(items).toEqual([
      { date: d1.toISOString(), quantity: 1, price: 2 },
    ]);
  });
});
