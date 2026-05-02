import { describe, expect, it } from "vitest";
import { resolvePackCount } from "../perfectPackCount.js";
describe("resolvePackCount", () => {
    it("reads count from title with шт in parentheses", () => {
        expect(resolvePackCount("Кулька 10 шт. в уп.", "")).toBe(10);
    });
    it("reads count from title with шт without parens", () => {
        expect(resolvePackCount("50 шт упаковка", "")).toBe(50);
    });
    it("prefers title over HTML block", () => {
        const html = "<p>Штук в упаковці: 100</p>";
        expect(resolvePackCount("Кулька 10 шт", html)).toBe(10);
    });
    it("uses Штук в упаковці when title has no pack", () => {
        const html = "<p>Штук в упаковці: 100</p>";
        expect(resolvePackCount("Кулька Gemar пастель", html)).toBe(100);
    });
    it("returns null when neither source has pack", () => {
        expect(resolvePackCount("Без фасовки", "<div>no</div>")).toBeNull();
        expect(resolvePackCount("Без фасовки", undefined)).toBeNull();
    });
});
