import { describe, expect, it } from "vitest";
import { parseJsonHtmlAttribute } from "../parseJsonHtmlAttribute.js";
describe("parseJsonHtmlAttribute", () => {
    it("parses plain JSON string", () => {
        expect(parseJsonHtmlAttribute('{"x":1}')).toEqual({ x: 1 });
    });
    it("returns undefined for missing or empty", () => {
        expect(parseJsonHtmlAttribute(undefined)).toBeUndefined();
        expect(parseJsonHtmlAttribute("")).toBeUndefined();
    });
    it("parses after entity decode fallback", () => {
        const raw = "{&#34;a&#34;:1}";
        expect(parseJsonHtmlAttribute(raw)).toEqual({ a: 1 });
    });
});
