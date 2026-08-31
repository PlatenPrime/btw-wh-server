import { describe, expect, it } from "vitest";
import { toSliceDate } from "../../../../utils/sliceDate.js";
import {
  getSliceRotationDayIndex,
  isProductDueForSliceRotation,
} from "../../../slices/utils/sliceRotation.js";
import { filterSlicedSkusForRotation } from "../filterSlicedSkusForRotation.js";

describe("filterSlicedSkusForRotation", () => {
  it("returns all skus when konk has no rotation", () => {
    const sliceDate = toSliceDate(new Date("2026-03-01T00:00:00.000Z"));
    const skus = [{ _id: { toString: () => "1" }, productId: "balun-1" }];
    const { skus: filtered, rotation } = filterSlicedSkusForRotation(
      skus,
      sliceDate,
      "balun"
    );
    expect(filtered).toEqual(skus);
    expect(rotation).toBeNull();
  });

  it("filters air skus to due bucket only", () => {
    const sliceDate = toSliceDate(new Date("2026-06-10T00:00:00.000Z"));
    const config = { cycleDays: 3 };
    const skus = Array.from({ length: 9 }, (_, i) => ({
      _id: { toString: () => String(i) },
      productId: `air-${i}`,
    }));
    const { skus: filtered, rotation } = filterSlicedSkusForRotation(
      skus,
      sliceDate,
      "air"
    );
    const dayIndex = getSliceRotationDayIndex(sliceDate, 3);
    expect(rotation).toEqual({ cycleDays: 3, dayIndex });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(9);
    for (const sku of filtered) {
      expect(
        isProductDueForSliceRotation(sku.productId!, sliceDate, config)
      ).toBe(true);
    }
  });
});
