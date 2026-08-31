import { describe, expect, it } from "vitest";
import { toSliceDate } from "../../../../utils/sliceDate.js";
import {
  filterProductsForSliceRotation,
  getProductRotationBucket,
  getSliceRotationDayIndex,
  isProductDueForSliceRotation,
  resolveSliceRotationInfo,
} from "../sliceRotation.js";

describe("getSliceRotationDayIndex", () => {
  it("returns 0..cycleDays-1 for slice date", () => {
    const sliceDate = toSliceDate(new Date("2026-03-01T12:00:00.000Z"));
    const dayIndex = getSliceRotationDayIndex(sliceDate, 3);
    expect(dayIndex).toBeGreaterThanOrEqual(0);
    expect(dayIndex).toBeLessThan(3);
  });

  it("is stable for the same slice date", () => {
    const d = toSliceDate(new Date("2026-08-31T02:00:00.000Z"));
    expect(getSliceRotationDayIndex(d, 3)).toBe(getSliceRotationDayIndex(d, 3));
  });
});

describe("isProductDueForSliceRotation", () => {
  it("matches bucket to day index", () => {
    const sliceDate = toSliceDate(new Date("2026-03-15T00:00:00.000Z"));
    const config = { cycleDays: 3 };
    const dayIndex = getSliceRotationDayIndex(sliceDate, 3);

    const dueIds = ["a", "b", "c", "air-1", "air-2", "air-999"].filter(
      (id) => getProductRotationBucket(id, 3) === dayIndex
    );
    for (const id of dueIds) {
      expect(isProductDueForSliceRotation(id, sliceDate, config)).toBe(true);
    }
  });

  it("returns false for blank productId", () => {
    const sliceDate = toSliceDate(new Date("2026-03-01T00:00:00.000Z"));
    expect(
      isProductDueForSliceRotation("  ", sliceDate, { cycleDays: 3 })
    ).toBe(false);
  });
});

describe("filterProductsForSliceRotation", () => {
  it("returns all items when konk has no rotation config", () => {
    const sliceDate = toSliceDate(new Date("2026-03-01T00:00:00.000Z"));
    const items = [{ productId: "balun-1" }, { productId: "balun-2" }];
    const { filtered, rotation } = filterProductsForSliceRotation(
      items,
      sliceDate,
      "balun"
    );
    expect(filtered).toEqual(items);
    expect(rotation).toBeNull();
  });

  it("filters air to roughly one third", () => {
    const sliceDate = toSliceDate(new Date("2026-06-10T00:00:00.000Z"));
    const items = Array.from({ length: 300 }, (_, i) => ({
      productId: `air-${i}`,
    }));
    const { filtered, rotation } = filterProductsForSliceRotation(
      items,
      sliceDate,
      "air"
    );
    expect(rotation).toEqual({
      cycleDays: 3,
      dayIndex: getSliceRotationDayIndex(sliceDate, 3),
    });
    expect(filtered.length).toBeGreaterThan(80);
    expect(filtered.length).toBeLessThan(120);
  });
});

describe("resolveSliceRotationInfo", () => {
  it("returns config for air", () => {
    const sliceDate = toSliceDate(new Date("2026-01-01T00:00:00.000Z"));
    const info = resolveSliceRotationInfo("air", sliceDate);
    expect(info).toEqual({
      cycleDays: 3,
      dayIndex: getSliceRotationDayIndex(sliceDate, 3),
    });
  });

  it("returns null for unknown konk", () => {
    expect(
      resolveSliceRotationInfo("balun", toSliceDate(new Date()))
    ).toBeNull();
  });
});
