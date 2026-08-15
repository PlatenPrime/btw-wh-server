import { describe, expect, it } from "vitest";
import { parseGraboSizeOption } from "../parseGraboSizeOption.js";
describe("parseGraboSizeOption", () => {
    it("takes prefix before first slash including inch mark", () => {
        expect(parseGraboSizeOption('14" / 13x34 cm')).toBe('14"');
        expect(parseGraboSizeOption('40" / 62x91x25 cm')).toBe('40"');
    });
    it("returns whole trimmed string when there is no slash", () => {
        expect(parseGraboSizeOption('14"')).toBe('14"');
    });
    it("returns null for empty or slash-only prefix", () => {
        expect(parseGraboSizeOption("")).toBeNull();
        expect(parseGraboSizeOption("   ")).toBeNull();
        expect(parseGraboSizeOption("  / 13x34 cm")).toBeNull();
    });
    it("uses only the first slash when several are present", () => {
        expect(parseGraboSizeOption('14" / 13x34 / extra')).toBe('14"');
    });
    it("trims spaces around the prefix", () => {
        expect(parseGraboSizeOption('  18"  /  foo')).toBe('18"');
    });
});
