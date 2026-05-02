import { describe, expect, it } from "vitest";
import { tryParseJsonRecord } from "../tryParseJsonRecord.js";
describe("tryParseJsonRecord", () => {
    it("parses object root", () => {
        expect(tryParseJsonRecord('{"a":1}')).toEqual({ a: 1 });
    });
    it("returns null for array, null, primitive", () => {
        expect(tryParseJsonRecord("[1]")).toBeNull();
        expect(tryParseJsonRecord("null")).toBeNull();
        expect(tryParseJsonRecord('"x"')).toBeNull();
    });
    it("returns null for invalid json and whitespace-only", () => {
        expect(tryParseJsonRecord("not json")).toBeNull();
        expect(tryParseJsonRecord("   ")).toBeNull();
    });
});
