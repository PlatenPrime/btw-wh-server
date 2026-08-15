import { describe, expect, it } from "vitest";
import { escapeGraboSkuRegex } from "../escapeGraboSkuRegex.js";
describe("escapeGraboSkuRegex", () => {
    it("escapes regex metacharacters", () => {
        expect(escapeGraboSkuRegex("a.b+c*d?")).toBe("a\\.b\\+c\\*d\\?");
        expect(escapeGraboSkuRegex("40\"")).toBe("40\"");
        expect(escapeGraboSkuRegex("(x)[y]{z}|^$\\")).toBe("\\(x\\)\\[y\\]\\{z\\}\\|\\^\\$\\\\");
    });
});
