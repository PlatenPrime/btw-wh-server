import { beforeEach, describe, expect, it, vi } from "vitest";
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
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    it("fetches product_rests URL without proxy and returns parsed map", async () => {
        vi.mocked(browserGet).mockResolvedValue("<pre>1501-3445 = 7; 8; 509.60</pre>");
        const map = await fetchSharikProductRestsMap("1302-0065");
        expect(browserGet).toHaveBeenCalledWith("https://sharik.ua/product_rests/1302-0065/");
        expect(map.get("1501-3445")).toEqual({
            actualQuantity: 7,
            sliceQuantity: 8,
            price: 509.6,
        });
    });
    it("throws when seed artikul is empty", async () => {
        await expect(fetchSharikProductRestsMap("")).rejects.toThrow("Seed artikul is required");
    });
    it("wraps browser errors", async () => {
        vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
        await expect(fetchSharikProductRestsMap("1302-0065")).rejects.toThrow("Failed to fetch Sharik product_rests: Network error");
    });
});
