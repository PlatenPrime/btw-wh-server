import { describe, expect, it } from "vitest";
import { stableStringBucket } from "../stableStringBucket.js";

describe("stableStringBucket", () => {
  it("returns value in 0..cycleDays-1", () => {
    for (const id of ["air-1", "air-2", "balun-x"]) {
      const bucket = stableStringBucket(id, 3);
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(3);
    }
  });

  it("is stable for the same input", () => {
    expect(stableStringBucket("air-4699949", 3)).toBe(
      stableStringBucket("air-4699949", 3)
    );
  });

  it("throws when cycleDays < 1", () => {
    expect(() => stableStringBucket("x", 0)).toThrow(/cycleDays/);
  });
});
