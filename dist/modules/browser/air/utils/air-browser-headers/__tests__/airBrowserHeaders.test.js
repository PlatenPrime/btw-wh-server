import { describe, expect, it } from "vitest";
import { AIR_BROWSER_HEADERS } from "../airBrowserHeaders.js";
describe("AIR_BROWSER_HEADERS", () => {
    it("использует Chrome 131 UA с согласованными Client Hints", () => {
        expect(AIR_BROWSER_HEADERS["User-Agent"]).toContain("Chrome/131");
        expect(AIR_BROWSER_HEADERS["sec-ch-ua"]).toContain('v="131"');
        expect(AIR_BROWSER_HEADERS["sec-ch-ua-mobile"]).toBe("?0");
        expect(AIR_BROWSER_HEADERS["sec-ch-ua-platform"]).toBe('"Windows"');
    });
    it("не запрашивает brotli и ставит uk-UA", () => {
        expect(AIR_BROWSER_HEADERS["Accept-Encoding"]).toBe("gzip, deflate");
        expect(AIR_BROWSER_HEADERS["Accept-Encoding"]).not.toContain("br");
        expect(AIR_BROWSER_HEADERS["Accept-Language"]).toBe("uk-UA,uk;q=0.9");
    });
    it("имеет навигационные Sec-Fetch заголовки", () => {
        expect(AIR_BROWSER_HEADERS["Sec-Fetch-Dest"]).toBe("document");
        expect(AIR_BROWSER_HEADERS["Sec-Fetch-Mode"]).toBe("navigate");
        expect(AIR_BROWSER_HEADERS["Sec-Fetch-Site"]).toBe("none");
        expect(AIR_BROWSER_HEADERS["Sec-Fetch-User"]).toBe("?1");
    });
});
