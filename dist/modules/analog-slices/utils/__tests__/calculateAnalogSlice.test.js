import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALOG_SLICE_KONK_NAMES, calculateAnalogSlice, } from "../calculateAnalogSlice.js";
import { runAnalogSliceForKonkUtil } from "../runAnalogSliceForKonkUtil.js";
vi.mock("../runAnalogSliceForKonkUtil.js");
describe("calculateAnalogSlice", () => {
    const mockResult = {
        saved: true,
        count: 2,
        total: 2,
        invalid: 0,
        errors: 0,
    };
    beforeEach(() => {
        vi.mocked(runAnalogSliceForKonkUtil).mockResolvedValue(mockResult);
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });
    it.each(ANALOG_SLICE_KONK_NAMES)("delegates %s to runAnalogSliceForKonkUtil", async (konkName) => {
        const result = await calculateAnalogSlice(konkName);
        expect(runAnalogSliceForKonkUtil).toHaveBeenCalledWith(konkName, new Date("2026-03-01T12:00:00.000Z"));
        expect(result).toEqual(mockResult);
    });
});
