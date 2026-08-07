import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSharikProductRestsMap } from "../fetchSharikProductRestsMap.js";
vi.mock("../../../../utils/browserRequest.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        browserGet: vi.fn(),
        logBrowserError: vi.fn(),
    };
});
import { browserGet } from "../../../../utils/browserRequest.js";
describe("fetchSharikProductRestsMap", () => {
    const originalProxy = process.env.SHARIK_HTTP_PROXY_URL;
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    afterEach(() => {
        if (originalProxy === undefined) {
            delete process.env.SHARIK_HTTP_PROXY_URL;
        }
        else {
            process.env.SHARIK_HTTP_PROXY_URL = originalProxy;
        }
    });
    it("fetches product_rests URL with proxyUrl from env", async () => {
        process.env.SHARIK_HTTP_PROXY_URL =
            "http://user:secret@77.47.252.164:50100";
        vi.mocked(browserGet).mockResolvedValue("<pre>1501-3445 = 7; 8; 509.60</pre>");
        const map = await fetchSharikProductRestsMap("1302-0065");
        expect(browserGet).toHaveBeenCalledWith("https://sharik.ua/product_rests/1302-0065/", { proxyUrl: "http://user:secret@77.47.252.164:50100" });
        expect(map.get("1501-3445")).toEqual({
            actualQuantity: 7,
            sliceQuantity: 8,
            price: 509.6,
        });
    });
    it("passes proxyUrl: undefined when env is empty", async () => {
        delete process.env.SHARIK_HTTP_PROXY_URL;
        vi.mocked(browserGet).mockResolvedValue("<pre></pre>");
        await fetchSharikProductRestsMap("1302-0065");
        expect(browserGet).toHaveBeenCalledWith("https://sharik.ua/product_rests/1302-0065/", { proxyUrl: undefined });
    });
    it("throws when seed artikul is empty", async () => {
        await expect(fetchSharikProductRestsMap("")).rejects.toThrow("Seed artikul is required");
    });
    it("wraps browser errors", async () => {
        delete process.env.SHARIK_HTTP_PROXY_URL;
        vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
        await expect(fetchSharikProductRestsMap("1302-0065")).rejects.toThrow("Failed to fetch Sharik product_rests: Network error");
    });
});
