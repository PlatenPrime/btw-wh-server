import { describe, expect, it } from "vitest";
import { ANALOG_SLICE_KONK_NAMES } from "../calculateAnalogSlice.js";
describe("ANALOG_SLICE_KONK_NAMES", () => {
    it("does not include air", () => {
        expect(ANALOG_SLICE_KONK_NAMES).not.toContain("air");
        expect([...ANALOG_SLICE_KONK_NAMES]).toEqual([
            "balun",
            "sharte",
            "yumi",
            "yumin",
        ]);
    });
});
