import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toSliceDate } from "../../../../../../utils/sliceDate.js";
import { getAirClientPendingUtil } from "../getAirClientPendingUtil.js";
vi.mock("../../../../utils/loadSlicedSkusForKonk.js", () => ({
    loadSlicedSkusForKonk: vi.fn(),
}));
vi.mock("../../../../models/SkuSlice.js", () => ({
    SkuSlice: {
        findOne: vi.fn(),
    },
}));
import { loadSlicedSkusForKonk } from "../../../../utils/loadSlicedSkusForKonk.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
describe("getAirClientPendingUtil", () => {
    const now = new Date("2026-07-26T12:00:00.000Z");
    const sliceDate = toSliceDate(now);
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it("treats missing slice document as all sliced skus pending", async () => {
        vi.mocked(loadSlicedSkusForKonk).mockResolvedValue([
            {
                _id: { toString: () => "s1" },
                productId: "air-1",
                title: "One",
                url: "https://airballoons.com.ua/ua/product/1",
            },
            {
                _id: { toString: () => "s2" },
                productId: "air-2",
                title: "Two",
                url: "https://airballoons.com.ua/ua/product/2",
            },
        ]);
        vi.mocked(SkuSlice.findOne).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(null),
            }),
        });
        const result = await getAirClientPendingUtil(now);
        expect(result.date).toEqual(sliceDate);
        expect(result.items).toEqual([
            {
                skuId: "s1",
                productId: "air-1",
                title: "One",
                url: "https://airballoons.com.ua/ua/product/1",
            },
            {
                skuId: "s2",
                productId: "air-2",
                title: "Two",
                url: "https://airballoons.com.ua/ua/product/2",
            },
        ]);
    });
    it("includes missing and -1 entries, skips valid ones", async () => {
        vi.mocked(loadSlicedSkusForKonk).mockResolvedValue([
            {
                _id: { toString: () => "s1" },
                productId: "air-1",
                title: "Valid",
                url: "https://airballoons.com.ua/ua/product/1",
            },
            {
                _id: { toString: () => "s2" },
                productId: "air-2",
                title: "Minus",
                url: "https://airballoons.com.ua/ua/product/2",
            },
            {
                _id: { toString: () => "s3" },
                productId: "air-3",
                title: "Missing",
                url: "https://airballoons.com.ua/ua/product/3",
            },
            {
                _id: { toString: () => "s4" },
                productId: "",
                title: "No pid",
                url: "https://airballoons.com.ua/ua/product/4",
            },
        ]);
        vi.mocked(SkuSlice.findOne).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue({
                    data: {
                        "air-1": { stock: 10, price: 2.1 },
                        "air-2": { stock: -1, price: -1 },
                    },
                }),
            }),
        });
        const result = await getAirClientPendingUtil(now);
        expect(result.items.map((i) => i.productId)).toEqual(["air-2", "air-3"]);
    });
});
