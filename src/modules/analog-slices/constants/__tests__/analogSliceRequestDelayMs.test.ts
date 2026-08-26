import { describe, expect, it } from "vitest";
import {
  ANALOG_SLICE_REQUEST_DELAY_BY_KONK,
  ANALOG_SLICE_REQUEST_DELAY_MS,
  resolveAnalogSliceRequestDelayMs,
} from "../analogSliceRequestDelayMs.js";

describe("analogSliceRequestDelayMs constants", () => {
  it("default delay is 1000 ms", () => {
    expect(ANALOG_SLICE_REQUEST_DELAY_MS).toBe(1000);
  });

  it("air override is 2x default", () => {
    expect(ANALOG_SLICE_REQUEST_DELAY_BY_KONK.air).toBe(2000);
  });
});

describe("resolveAnalogSliceRequestDelayMs", () => {
  it("returns default for unknown konk", () => {
    expect(resolveAnalogSliceRequestDelayMs("balun")).toBe(1000);
  });

  it("returns default for empty / blank", () => {
    expect(resolveAnalogSliceRequestDelayMs("")).toBe(1000);
    expect(resolveAnalogSliceRequestDelayMs("   ")).toBe(1000);
  });

  it("returns air 2x delay case-insensitively", () => {
    expect(resolveAnalogSliceRequestDelayMs("air")).toBe(2000);
    expect(resolveAnalogSliceRequestDelayMs(" AIR ")).toBe(2000);
  });
});
