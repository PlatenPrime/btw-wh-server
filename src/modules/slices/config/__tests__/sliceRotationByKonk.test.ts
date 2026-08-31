import { describe, expect, it } from "vitest";
import {
  resolveSliceRotationConfig,
  SLICE_ROTATION_BY_KONK,
} from "../sliceRotationByKonk.js";

describe("sliceRotationByKonk", () => {
  it("air has 3-day cycle", () => {
    expect(SLICE_ROTATION_BY_KONK.air).toEqual({ cycleDays: 3 });
  });

  it("resolveSliceRotationConfig is case-insensitive", () => {
    expect(resolveSliceRotationConfig(" AIR ")).toEqual({ cycleDays: 3 });
  });

  it("returns null for unknown konk", () => {
    expect(resolveSliceRotationConfig("yumi")).toBeNull();
  });
});
