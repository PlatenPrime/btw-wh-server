import { describe, expect, it } from "vitest";
import {
  excludedCompetitors,
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../excludedCompetitors.js";

describe("normalizeCompetitorName", () => {
  it("trims and lowercases", () => {
    expect(normalizeCompetitorName(" Yumi ")).toBe("yumi");
    expect(normalizeCompetitorName("AIR")).toBe("air");
  });
});

describe("getExcludedCompetitorSet", () => {
  it("returns normalized names for skuSlices", () => {
    const set = getExcludedCompetitorSet("skuSlices");

    expect(set).toEqual(new Set(["yumi"]));
  });

  it("returns empty set for analogSlices", () => {
    expect(getExcludedCompetitorSet("analogSlices")).toEqual(new Set());
  });

  it("reflects excludedCompetitors config", () => {
    for (const sliceType of ["analogSlices", "skuSlices"] as const) {
      const expected = new Set(
        excludedCompetitors[sliceType].map((name) =>
          normalizeCompetitorName(name)
        )
      );
      expect(getExcludedCompetitorSet(sliceType)).toEqual(expected);
    }
  });
});
