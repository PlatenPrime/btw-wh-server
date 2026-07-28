import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSharikProductRestsMap } from "../fetchSharikProductRestsMap.js";
vi.mock("../../../browser/utils/browserRequest.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        browserGet: vi.fn(),
        logBrowserError: vi.fn(),
    };
});
import { browserGet } from "../../../browser/utils/browserRequest.js";
describe("fetchSharikProductRestsMap", () => {
    const originalProxy = process.env.SHARIK_HTTP_PROXY_URL;
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
        delete process.env.SHARIK_HTTP_PROXY_URL;
    });
    afterEach(() => {
        if (originalProxy === undefined) {
            delete process.env.SHARIK_HTTP_PROXY_URL;
        }
        else {
            process.env.SHARIK_HTTP_PROXY_URL = originalProxy;
        }
    });
    it("fetches product_rests URL and returns parsed map", async () => {
        vi.mocked(browserGet).mockResolvedValue("<pre>1501-3445 = 7; 509.60</pre>");
        const map = await fetchSharikProductRestsMap("1302-0065");
        expect(browserGet).toHaveBeenCalledWith("https://sharik.ua/product_rests/1302-0065/", { proxyUrl: undefined });
        expect(map.get("1501-3445")).toEqual({ quantity: 7, price: 509.6 });
    });
    it("передаёт SHARIK_HTTP_PROXY_URL в browserGet", async () => {
        process.env.SHARIK_HTTP_PROXY_URL =
            "http://user:secret@77.47.252.164:50100";
        vi.mocked(browserGet).mockResolvedValue("<pre>1501-3445 = 7; 509.60</pre>");
        await fetchSharikProductRestsMap("1302-0065");
        expect(browserGet).toHaveBeenCalledWith("https://sharik.ua/product_rests/1302-0065/", { proxyUrl: "http://user:secret@77.47.252.164:50100" });
    });
    it("throws when seed artikul is empty", async () => {
        await expect(fetchSharikProductRestsMap("")).rejects.toThrow("Seed artikul is required");
    });
    it("wraps browser errors", async () => {
        vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
        await expect(fetchSharikProductRestsMap("1302-0065")).rejects.toThrow("Failed to fetch Sharik product_rests: Network error");
    });
});
