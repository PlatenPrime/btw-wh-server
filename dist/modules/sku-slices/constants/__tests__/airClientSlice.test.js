import { describe, expect, it } from "vitest";
import { AIR_CLIENT_HTML_MAX_CHARS, AIR_CLIENT_SLICE_KONK, } from "../airClientSlice.js";
describe("airClientSlice constants", () => {
    it("exports air konk key", () => {
        expect(AIR_CLIENT_SLICE_KONK).toBe("air");
    });
    it("exports positive html max", () => {
        expect(AIR_CLIENT_HTML_MAX_CHARS).toBeGreaterThan(0);
    });
});
