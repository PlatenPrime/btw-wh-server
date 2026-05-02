import { describe, expect, it } from "vitest";
import { mergeCookies, parseSetCookieHeader, pickHeaderCaseInsensitive, } from "../mergeResponseCookies.js";
describe("pickHeaderCaseInsensitive", () => {
    it("finds header ignoring case", () => {
        expect(pickHeaderCaseInsensitive({ "Set-Cookie": ["a=1"] }, "set-cookie")).toEqual(["a=1"]);
    });
    it("returns undefined when missing", () => {
        expect(pickHeaderCaseInsensitive({}, "set-cookie")).toBeUndefined();
    });
});
describe("parseSetCookieHeader", () => {
    it("normalizes string to array", () => {
        expect(parseSetCookieHeader("sid=1; Path=/")).toEqual(["sid=1; Path=/"]);
    });
    it("filters non-strings from array", () => {
        expect(parseSetCookieHeader(["a=1", 42, "b=2"])).toEqual(["a=1", "b=2"]);
    });
    it("returns empty for invalid", () => {
        expect(parseSetCookieHeader(null)).toEqual([]);
        expect(parseSetCookieHeader(undefined)).toEqual([]);
    });
});
describe("mergeCookies", () => {
    it("merges Set-Cookie rows into Cookie header", () => {
        const out = mergeCookies("", ["PHPSESSID=abc; path=/", "foo=bar; path=/"]);
        expect(out).toContain("PHPSESSID=abc");
        expect(out).toContain("foo=bar");
    });
    it("merges existing Cookie with new Set-Cookie", () => {
        const out = mergeCookies("PHPSESSID=old", ["PHPSESSID=new; path=/"]);
        expect(out).toBe("PHPSESSID=new");
    });
    it("later Set-Cookie overwrites same name", () => {
        const out = mergeCookies("a=1", ["a=2; path=/"]);
        expect(out).toBe("a=2");
    });
});
