import { describe, expect, it } from "vitest";
import { mapSliceDocsToRangeItems } from "../mapSliceDocsToRangeItems.js";

describe("mapSliceDocsToRangeItems", () => {
  it("maps matching productKey entries to range items", () => {
    const docs = [
      {
        date: new Date("2026-03-01T00:00:00.000Z"),
        data: { P1: { stock: 10, price: 100 } },
      },
      {
        date: new Date("2026-03-02T00:00:00.000Z"),
        data: { P1: { stock: 8, price: 99 } },
      },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1")).toEqual([
      { date: "2026-03-01T00:00:00.000Z", stock: 10, price: 100 },
      { date: "2026-03-02T00:00:00.000Z", stock: 8, price: 99 },
    ]);
  });

  it("skips docs without productKey entry", () => {
    const docs = [
      {
        date: new Date("2026-03-01T00:00:00.000Z"),
        data: { P2: { stock: 1, price: 1 } },
      },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1")).toEqual([]);
  });

  it("handles missing data field", () => {
    const docs = [{ date: new Date("2026-03-01T00:00:00.000Z") }];
    expect(mapSliceDocsToRangeItems(docs, "P1")).toEqual([]);
  });
});
