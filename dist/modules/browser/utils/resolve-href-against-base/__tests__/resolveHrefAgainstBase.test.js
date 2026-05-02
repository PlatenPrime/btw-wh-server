import { describe, expect, it } from "vitest";
import { resolveHrefAgainstBase } from "../resolveHrefAgainstBase.js";
describe("resolveHrefAgainstBase", () => {
    it("resolves relative path", () => {
        expect(resolveHrefAgainstBase("/p/1", "https://example.com/list?page=1")).toBe("https://example.com/p/1");
    });
    it("returns null for empty or hash-only", () => {
        expect(resolveHrefAgainstBase("", "https://a.com/")).toBeNull();
        expect(resolveHrefAgainstBase("  ", "https://a.com/")).toBeNull();
        expect(resolveHrefAgainstBase("#", "https://a.com/")).toBeNull();
    });
});
