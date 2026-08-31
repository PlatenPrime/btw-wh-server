import { describe, expect, it } from "vitest";
import { mapSliceDocsToRangeItems } from "../mapSliceDocsToRangeItems.js";

describe("mapSliceDocsToRangeItems", () => {
  const d0 = new Date("2026-03-01T00:00:00.000Z");
  const d1 = new Date("2026-03-02T00:00:00.000Z");
  const d2 = new Date("2026-03-03T00:00:00.000Z");
  const range = { dateFrom: d0, dateTo: d2 };

  it("maps matching productKey entries to range items (sparse)", () => {
    const docs = [
      {
        date: d0,
        data: { P1: { stock: 10, price: 100 } },
      },
      {
        date: d1,
        data: { P1: { stock: 8, price: 99 } },
      },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1")).toEqual([
      { date: d0.toISOString(), stock: 10, price: 100 },
      { date: d1.toISOString(), stock: 8, price: 99 },
    ]);
  });

  it("skips docs without productKey entry (sparse)", () => {
    const docs = [
      {
        date: d0,
        data: { P2: { stock: 1, price: 1 } },
      },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1")).toEqual([]);
  });

  it("handles missing data field (sparse)", () => {
    const docs = [{ date: d0 }];
    expect(mapSliceDocsToRangeItems(docs, "P1")).toEqual([]);
  });

  it("returns dense range with carry when only first day scraped", () => {
    const docs = [
      {
        date: d0,
        data: { P1: { stock: 10, price: 100 } },
      },
      { date: d1, data: {} },
      { date: d2, data: {} },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1", range)).toEqual([
      { date: d0.toISOString(), stock: 10, price: 100 },
      { date: d1.toISOString(), stock: 10, price: 100 },
      { date: d2.toISOString(), stock: 10, price: 100 },
    ]);
  });

  it("carries forward over -1/-1 on dense range", () => {
    const docs = [
      {
        date: d0,
        data: { P1: { stock: 10, price: 100 } },
      },
      {
        date: d1,
        data: { P1: { stock: -1, price: -1 } },
      },
      {
        date: d2,
        data: { P1: { stock: -1, price: -1 } },
      },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1", range)).toEqual([
      { date: d0.toISOString(), stock: 10, price: 100 },
      { date: d1.toISOString(), stock: 10, price: 100 },
      { date: d2.toISOString(), stock: 10, price: 100 },
    ]);
  });

  it("carries forward when productKey missing on rotation off-day", () => {
    const docs = [
      {
        date: d0,
        data: { P1: { stock: 5, price: 50 } },
      },
      {
        date: d1,
        data: { P2: { stock: 99, price: 99 } },
      },
      { date: d2, data: {} },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1", range)).toEqual([
      { date: d0.toISOString(), stock: 5, price: 50 },
      { date: d1.toISOString(), stock: 5, price: 50 },
      { date: d2.toISOString(), stock: 5, price: 50 },
    ]);
  });

  it("uses warmStart doc to fill first day of dense range", () => {
    const warmDay = new Date("2026-02-28T00:00:00.000Z");
    const docs = [
      {
        date: warmDay,
        data: { P1: { stock: 7, price: 70 } },
      },
    ];

    expect(mapSliceDocsToRangeItems(docs, "P1", range)).toEqual([
      { date: d0.toISOString(), stock: 7, price: 70 },
      { date: d1.toISOString(), stock: 7, price: 70 },
      { date: d2.toISOString(), stock: 7, price: 70 },
    ]);
  });

  it("returns zeros on dense range when no valid sample exists", () => {
    expect(mapSliceDocsToRangeItems([], "P1", range)).toEqual([
      { date: d0.toISOString(), stock: 0, price: 0 },
      { date: d1.toISOString(), stock: 0, price: 0 },
      { date: d2.toISOString(), stock: 0, price: 0 },
    ]);
  });
});
