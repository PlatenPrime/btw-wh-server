import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "../decodeHtmlEntities.js";
describe("decodeHtmlEntities", () => {
    it("decodes named entities", () => {
        expect(decodeHtmlEntities("a&amp;b")).toBe("a&b");
        expect(decodeHtmlEntities("&quot;x&quot;")).toBe('"x"');
        expect(decodeHtmlEntities("&nbsp;")).toBe(" ");
    });
    it("decodes decimal numeric references", () => {
        expect(decodeHtmlEntities("&#39;")).toBe("'");
    });
    it("decodes hex numeric references", () => {
        expect(decodeHtmlEntities("&#x27;")).toBe("'");
    });
});
