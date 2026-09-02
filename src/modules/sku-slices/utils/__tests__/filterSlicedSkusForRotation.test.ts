import { describe, expect, it } from "vitest";
import { toSliceDate } from "../../../../utils/sliceDate.js";
import { filterSlicedSkusForRotation } from "../filterSlicedSkusForRotation.js";

describe("filterSlicedSkusForRotation", () => {
  it.each(["balun", "air"] as const)(
    "returns all skus when %s has no rotation",
    (konkName) => {
      const sliceDate = toSliceDate(new Date("2026-03-01T00:00:00.000Z"));
      const skus = [
        { _id: { toString: () => "1" }, productId: `${konkName}-1` },
        { _id: { toString: () => "2" }, productId: `${konkName}-2` },
      ];
      const { skus: filtered, rotation } = filterSlicedSkusForRotation(
        skus,
        sliceDate,
        konkName
      );
      expect(filtered).toEqual(skus);
      expect(rotation).toBeNull();
    }
  );
});
