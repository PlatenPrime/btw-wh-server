import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../skus/models/Sku.js", () => ({
    Sku: { findOne: vi.fn() },
}));
vi.mock("../../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js", () => ({
    getSkuStockDataUtil: vi.fn(),
    UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));
vi.mock("../../../sku-slices/models/SkuSlice.js", () => ({
    SkuSlice: { find: vi.fn(), findOneAndUpdate: vi.fn() },
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
    getExcludedCompetitorSet: vi.fn(),
    normalizeCompetitorName: vi.fn((v) => v.trim().toLowerCase()),
}));
import { Sku } from "../../../skus/models/Sku.js";
import { getSkuStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../../../sku-slices/models/SkuSlice.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { runCompensatingSkuSlices } from "../runCompensatingSkuSlices.js";
describe("runCompensatingSkuSlices", () => {
    const sliceDate = new Date("2025-03-01T00:00:00.000Z");
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set());
        vi.mocked(SkuSlice.findOneAndUpdate).mockResolvedValue({});
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    function mockFindLean(docs) {
        vi.mocked(SkuSlice.find).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(docs),
            }),
        });
    }
    function mockSkuFindOne(id) {
        vi.mocked(Sku.findOne).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(id ? { _id: { toString: () => id } } : null),
            }),
        });
    }
    it("skips excluded competitors", async () => {
        vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set(["yumi"]));
        mockFindLean([
            { konkName: "yumi", data: { P1: { stock: -1, price: -1 } } },
        ]);
        const r = await runCompensatingSkuSlices(sliceDate);
        expect(r).toEqual({ refetched: 0, updated: 0 });
        expect(getSkuStockDataUtil).not.toHaveBeenCalled();
    });
    it("does not update when fetch still returns -1/-1", async () => {
        mockFindLean([
            { konkName: "air", data: { P1: { stock: -1, price: -1 } } },
        ]);
        mockSkuFindOne("sid1");
        vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: -1, price: -1 });
        const r = await runCompensatingSkuSlices(sliceDate);
        expect(r).toEqual({ refetched: 1, updated: 0 });
        expect(SkuSlice.findOneAndUpdate).not.toHaveBeenCalled();
    });
    it("updates when fetch returns non-full-minus", async () => {
        mockFindLean([
            { konkName: "air", data: { P1: { stock: -1, price: -1 } } },
        ]);
        mockSkuFindOne("sid1");
        vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 5, price: -1 });
        const r = await runCompensatingSkuSlices(sliceDate);
        expect(r).toEqual({ refetched: 1, updated: 1 });
        expect(SkuSlice.findOneAndUpdate).toHaveBeenCalledWith({ konkName: "air", date: sliceDate }, { $set: { "data.P1": { stock: 5, price: -1 } } });
    });
    it("skips on UNSUPPORTED_KONK without throwing", async () => {
        mockFindLean([
            { konkName: "x", data: { P1: { stock: -1, price: -1 } } },
        ]);
        mockSkuFindOne("sid1");
        const err = new Error("bad");
        err.code = UNSUPPORTED_KONK_CODE;
        vi.mocked(getSkuStockDataUtil).mockRejectedValue(err);
        const r = await runCompensatingSkuSlices(sliceDate);
        expect(r).toEqual({ refetched: 0, updated: 0 });
    });
});
