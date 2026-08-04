import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBtradeSlice } from "../calculateBtradeSlice.js";
vi.mock("../../../browser/sharik/utils/product-rests/index.js", () => ({
    getCachedSharikProductRestsMap: vi.fn(),
}));
vi.mock("../../models/BtradeSlice.js", () => ({
    BtradeSlice: {
        findOneAndUpdate: vi.fn(),
    },
}));
vi.mock("../getUniqueArtikulsFromArtsUtil.js", () => ({
    getUniqueArtikulsFromArtsUtil: vi.fn(),
}));
import { getCachedSharikProductRestsMap } from "../../../browser/sharik/utils/product-rests/index.js";
import { BtradeSlice } from "../../models/BtradeSlice.js";
import { getUniqueArtikulsFromArtsUtil } from "../getUniqueArtikulsFromArtsUtil.js";
describe("calculateBtradeSlice", () => {
    const mockSliceDate = new Date("2025-03-01T00:00:00.000Z");
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockSliceDate);
        vi.mocked(getUniqueArtikulsFromArtsUtil).mockResolvedValue([
            "ART-1",
            "ART-2",
        ]);
        vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(new Map([
            ["ART-1", { actualQuantity: 3, sliceQuantity: 5, price: 100 }],
            ["ART-2", { actualQuantity: 8, sliceQuantity: 10, price: 200 }],
        ]));
        vi.mocked(BtradeSlice.findOneAndUpdate).mockResolvedValue({});
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });
    it("saves sliceQuantity from product_rests in a single DB update", async () => {
        const result = await calculateBtradeSlice();
        expect(result).toEqual({
            saved: true,
            count: 2,
            totalArtikuls: 2,
            missing: 0,
            fromProductRests: 2,
        });
        expect(getCachedSharikProductRestsMap).toHaveBeenCalledTimes(1);
        expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledWith({ date: mockSliceDate }, {
            $set: {
                date: mockSliceDate,
                data: {
                    "ART-1": { price: 100, quantity: 5 },
                    "ART-2": { price: 200, quantity: 10 },
                },
            },
        }, { upsert: true });
    });
    it("writes -1/-1 sentinel when artikul missing on product_rests", async () => {
        vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(new Map([["ART-1", { actualQuantity: 3, sliceQuantity: 5, price: 100 }]]));
        const result = await calculateBtradeSlice();
        expect(result).toEqual({
            saved: true,
            count: 1,
            totalArtikuls: 2,
            missing: 1,
            fromProductRests: 1,
        });
        expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledWith({ date: mockSliceDate }, {
            $set: {
                date: mockSliceDate,
                data: {
                    "ART-1": { price: 100, quantity: 5 },
                    "ART-2": { price: -1, quantity: -1 },
                },
            },
        }, { upsert: true });
    });
    it("when no artikuls only upserts empty data", async () => {
        vi.mocked(getUniqueArtikulsFromArtsUtil).mockResolvedValue([]);
        vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(new Map());
        const result = await calculateBtradeSlice();
        expect(result).toEqual({
            saved: true,
            count: 0,
            totalArtikuls: 0,
            missing: 0,
            fromProductRests: 0,
        });
        expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledWith({ date: mockSliceDate }, { $set: { date: mockSliceDate, data: {} } }, { upsert: true });
    });
});
