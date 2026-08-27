import { describe, expect, it } from "vitest";
import {
  compensationExcludedCompetitors,
  excludedCompetitors,
  getCompensationExcludedCompetitorSet,
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
  it("returns normalized names for skuSlices without air", () => {
    const set = getExcludedCompetitorSet("skuSlices");

    expect(set).toEqual(new Set(["yumi"]));
    expect(set.has("air")).toBe(false);
  });

  it("returns empty set for analogSlices (air enabled)", () => {
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

describe("getCompensationExcludedCompetitorSet", () => {
  it("skuSlices unions yumi (cron) and air (compensation-only)", () => {
    expect(getCompensationExcludedCompetitorSet("skuSlices")).toEqual(
      new Set(["yumi", "air"])
    );
    expect(getExcludedCompetitorSet("skuSlices").has("air")).toBe(false);
  });

  it("analogSlices excludes air only from compensation", () => {
    expect(getCompensationExcludedCompetitorSet("analogSlices")).toEqual(
      new Set(["air"])
    );
    expect(getExcludedCompetitorSet("analogSlices")).toEqual(new Set());
  });

  it("reflects union of both configs", () => {
    for (const sliceType of ["analogSlices", "skuSlices"] as const) {
      const expected = new Set(
        [
          ...excludedCompetitors[sliceType],
          ...compensationExcludedCompetitors[sliceType],
        ].map((name) => normalizeCompetitorName(name))
      );
      expect(getCompensationExcludedCompetitorSet(sliceType)).toEqual(expected);
    }
  });
});
