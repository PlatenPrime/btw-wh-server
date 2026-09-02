import { describe, expect, it } from "vitest";
import {
  resolveSliceRotationConfig,
  SLICE_ROTATION_BY_KONK,
} from "../sliceRotationByKonk.js";

describe("sliceRotationByKonk", () => {
  it("air has no rotation cycle", () => {
    expect(SLICE_ROTATION_BY_KONK.air).toBeUndefined();
    expect(resolveSliceRotationConfig("air")).toBeNull();
  });

  it("resolveSliceRotationConfig is case-insensitive for missing konk", () => {
    expect(resolveSliceRotationConfig(" AIR ")).toBeNull();
  });

  it("returns null for unknown konk", () => {
    expect(resolveSliceRotationConfig("yumi")).toBeNull();
  });
});
