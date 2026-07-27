import { describe, expect, it } from "vitest";
import { ANALOG_SLICE_KONK_NAMES } from "../calculateAnalogSlice.js";

describe("ANALOG_SLICE_KONK_NAMES", () => {
  it("includes air and known competitors", () => {
    expect(ANALOG_SLICE_KONK_NAMES).toContain("air");
    expect([...ANALOG_SLICE_KONK_NAMES]).toEqual([
      "air",
      "balun",
      "sharte",
      "yumi",
      "yumin",
    ]);
  });
});
