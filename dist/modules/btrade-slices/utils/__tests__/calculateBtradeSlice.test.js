import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBtradeSlice } from "../calculateBtradeSlice.js";
vi.mock("../../../browser/sharik/utils/getSharikStockData.js", () => ({
    getSharikStockData: vi.fn(),
}));
vi.mock("../../models/BtradeSlice.js", () => ({
    BtradeSlice: {
        findOneAndUpdate: vi.fn(),
    },
}));
vi.mock("../getUniqueArtikulsFromAnalogsUtil.js", () => ({
    getUniqueArtikulsFromAnalogsUtil: vi.fn(),
}));
import { getSharikStockData } from "../../../browser/sharik/utils/getSharikStockData.js";
import { BtradeSlice } from "../../models/BtradeSlice.js";
import { getUniqueArtikulsFromAnalogsUtil } from "../getUniqueArtikulsFromAnalogsUtil.js";
describe("calculateBtradeSlice", () => {
    const mockSliceDate = new Date("2025-03-01T00:00:00.000Z");
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockSliceDate);
        vi.mocked(getUniqueArtikulsFromAnalogsUtil).mockResolvedValue(["ART-1", "ART-2"]);
        vi.mocked(getSharikStockData)
            .mockResolvedValueOnce({ nameukr: "T1", price: 100, quantity: 5 })
            .mockResolvedValueOnce({ nameukr: "T2", price: 200, quantity: 10 });
        vi.mocked(BtradeSlice.findOneAndUpdate).mockResolvedValue({});
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });
    it("creates slice document first with empty data then fills data per artikul", async () => {
        const resultPromise = calculateBtradeSlice();
        await vi.runAllTimersAsync();
        const result = await resultPromise;
        expect(result).toEqual({ saved: true, count: 2 });
        expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledTimes(3);
        const calls = vi.mocked(BtradeSlice.findOneAndUpdate).mock.calls;
        expect(calls[0][0]).toEqual({ date: mockSliceDate });
        expect(calls[0][1]).toEqual({
            $setOnInsert: { date: mockSliceDate, data: {} },
        });
        expect(calls[0][2]).toEqual({ upsert: true });
        expect(calls[1][1]).toEqual({
            $set: { "data.ART-1": { price: 100, quantity: 5 } },
        });
        expect(calls[2][1]).toEqual({
            $set: { "data.ART-2": { price: 200, quantity: 10 } },
        });
    });
    it("when no artikuls only initial upsert is called", async () => {
        vi.mocked(getUniqueArtikulsFromAnalogsUtil).mockResolvedValue([]);
        const result = await calculateBtradeSlice();
        expect(result).toEqual({ saved: true, count: 0 });
        expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });
});
