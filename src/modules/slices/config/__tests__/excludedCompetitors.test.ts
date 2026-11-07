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

  it("reflects excludedCompetitors config", () => {
    const expected = new Set(
      excludedCompetitors.skuSlices.map((name) => normalizeCompetitorName(name)),
    );
    expect(getExcludedCompetitorSet("skuSlices")).toEqual(expected);
  });
});

describe("getCompensationExcludedCompetitorSet", () => {
  it("skuSlices unions yumi (cron) and air (compensation-only)", () => {
    expect(getCompensationExcludedCompetitorSet("skuSlices")).toEqual(new Set(["yumi", "air"]));
    expect(getExcludedCompetitorSet("skuSlices").has("air")).toBe(false);
  });

  it("reflects union of both configs", () => {
    const expected = new Set(
      [...excludedCompetitors.skuSlices, ...compensationExcludedCompetitors.skuSlices].map((name) =>
        normalizeCompetitorName(name),
      ),
    );
    expect(getCompensationExcludedCompetitorSet("skuSlices")).toEqual(expected);
  });
});
