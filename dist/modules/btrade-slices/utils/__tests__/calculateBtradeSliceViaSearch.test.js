import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../../../test/setup.js";
vi.mock("../../../browser/sharik/utils/getSharikStockData.js", () => ({
    getSharikStockData: vi.fn(),
}));
vi.mock("../../../../utils/delay.js", () => ({
    delay: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../../utils/jitterMs.js", () => ({
    jitterMs: vi.fn(() => 0),
}));
import { getSharikStockData } from "../../../browser/sharik/utils/getSharikStockData.js";
import { BtradeSlice } from "../../models/BtradeSlice.js";
import { calculateBtradeSliceViaSearch, fetchMissingBtradeSliceItemsViaSearch, } from "../calculateBtradeSliceViaSearch.js";
import { getUniqueArtikulsFromArtsUtil } from "../getUniqueArtikulsFromArtsUtil.js";
vi.mock("../getUniqueArtikulsFromArtsUtil.js", () => ({
    getUniqueArtikulsFromArtsUtil: vi.fn(),
}));
describe("calculateBtradeSliceViaSearch", () => {
    const mockSliceDate = new Date("2025-03-01T00:00:00.000Z");
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockSliceDate);
        vi.mocked(getUniqueArtikulsFromArtsUtil).mockResolvedValue([
            "ART-1",
            "ART-2",
        ]);
        vi.mocked(getSharikStockData).mockImplementation(async (artikul) => {
            if (artikul === "ART-1") {
                return { nameukr: "Item 1", price: 100, quantity: 5 };
            }
            return null;
        });
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });
    it("calculateBtradeSliceViaSearch upserts slice and saves found artikuls", async () => {
        const result = await calculateBtradeSliceViaSearch();
        expect(result).toEqual({ saved: true, count: 1 });
        expect(getSharikStockData).toHaveBeenCalledTimes(2);
        const saved = await BtradeSlice.findOne({ date: mockSliceDate }).lean();
        expect(saved?.data).toEqual({
            "ART-1": { price: 100, quantity: 5 },
        });
    });
    it("fetchMissingBtradeSliceItemsViaSearch returns only found items", async () => {
        vi.mocked(getSharikStockData).mockResolvedValue({
            nameukr: "Item",
            price: 200,
            quantity: 10,
        });
        const result = await fetchMissingBtradeSliceItemsViaSearch([
            "ART-1",
            "ART-2",
        ]);
        expect(result).toEqual({
            "ART-1": { price: 200, quantity: 10 },
            "ART-2": { price: 200, quantity: 10 },
        });
        expect(getSharikStockData).toHaveBeenCalledTimes(2);
    });
    it("fetchMissingBtradeSliceItemsViaSearch skips failed lookups", async () => {
        vi.mocked(getSharikStockData)
            .mockResolvedValueOnce({ nameukr: "Item 1", price: 100, quantity: 5 })
            .mockRejectedValueOnce(new Error("network error"));
        const result = await fetchMissingBtradeSliceItemsViaSearch([
            "ART-1",
            "ART-2",
        ]);
        expect(result).toEqual({
            "ART-1": { price: 100, quantity: 5 },
        });
    });
});
