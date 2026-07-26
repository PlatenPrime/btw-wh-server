import { beforeEach, describe, expect, it, vi } from "vitest";
import { toSliceDate } from "../../../../../../utils/sliceDate.js";
import { putAirClientSkuSliceUtil } from "../putAirClientSkuSliceUtil.js";
vi.mock("../../../../../browser/air/utils/air-product-page-from-html/readAirProductFromHtml.js", () => ({
    readAirProductFromHtml: vi.fn(),
}));
vi.mock("../../../../../skus/models/Sku.js", () => ({
    Sku: { findById: vi.fn() },
}));
vi.mock("../../../../../skugrs/models/Skugr.js", () => ({
    Skugr: { exists: vi.fn() },
}));
vi.mock("../../../../models/SkuSlice.js", () => ({
    SkuSlice: {
        findOneAndUpdate: vi.fn(),
        findOne: vi.fn(),
    },
}));
import { readAirProductFromHtml } from "../../../../../browser/air/utils/air-product-page-from-html/readAirProductFromHtml.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
describe("putAirClientSkuSliceUtil", () => {
    const now = new Date("2026-07-26T12:00:00.000Z");
    const sliceDate = toSliceDate(now);
    const skuId = "507f1f77bcf86cd799439011";
    const input = {
        skuId,
        sourceUrl: "https://airballoons.com.ua/ua/product/x",
        html: "<html>ok</html>",
    };
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Sku.findById).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue({
                    _id: skuId,
                    konkName: "air",
                    productId: "air-1",
                    url: "https://airballoons.com.ua/ua/product/x",
                }),
            }),
        });
        vi.mocked(Skugr.exists).mockResolvedValue({ _id: "g1" });
        vi.mocked(readAirProductFromHtml).mockReturnValue({
            stock: 12,
            price: 2.1,
        });
        vi.mocked(SkuSlice.findOneAndUpdate)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            data: { "air-1": { stock: 12, price: 2.1 } },
        });
    });
    it("returns SKU_NOT_FOUND", async () => {
        vi.mocked(Sku.findById).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(null),
            }),
        });
        const result = await putAirClientSkuSliceUtil(input, now);
        expect(result).toEqual({
            ok: false,
            code: "SKU_NOT_FOUND",
            message: "Sku not found",
        });
    });
    it("returns NOT_AIR for other competitor", async () => {
        vi.mocked(Sku.findById).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue({
                    _id: skuId,
                    konkName: "balun",
                    productId: "balun-1",
                    url: input.sourceUrl,
                }),
            }),
        });
        const result = await putAirClientSkuSliceUtil(input, now);
        expect(result).toMatchObject({ ok: false, code: "NOT_AIR" });
    });
    it("returns NOT_SLICED when sku not in sliced group", async () => {
        vi.mocked(Skugr.exists).mockResolvedValue(null);
        const result = await putAirClientSkuSliceUtil(input, now);
        expect(result).toMatchObject({ ok: false, code: "NOT_SLICED" });
    });
    it("returns URL_MISMATCH", async () => {
        const result = await putAirClientSkuSliceUtil({ ...input, sourceUrl: "https://airballoons.com.ua/ua/product/other" }, now);
        expect(result).toMatchObject({ ok: false, code: "URL_MISMATCH" });
    });
    it("returns PARSE_FAILED for -1/-1", async () => {
        vi.mocked(readAirProductFromHtml).mockReturnValue({
            stock: -1,
            price: -1,
        });
        const result = await putAirClientSkuSliceUtil(input, now);
        expect(result).toMatchObject({ ok: false, code: "PARSE_FAILED" });
    });
    it("saves when filter matches", async () => {
        const result = await putAirClientSkuSliceUtil(input, now);
        expect(result).toEqual({
            ok: true,
            status: "saved",
            date: sliceDate,
            productId: "air-1",
            stock: 12,
            price: 2.1,
        });
        expect(SkuSlice.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
    it("skips when valid value already exists", async () => {
        vi.mocked(SkuSlice.findOneAndUpdate)
            .mockReset()
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce(null);
        vi.mocked(SkuSlice.findOne).mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue({
                    data: { "air-1": { stock: 9, price: 1.5 } },
                }),
            }),
        });
        const result = await putAirClientSkuSliceUtil(input, now);
        expect(result).toEqual({
            ok: true,
            status: "skipped",
            date: sliceDate,
            productId: "air-1",
            stock: 9,
            price: 1.5,
        });
    });
});
