import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sku } from "../../../../models/Sku.js";
vi.mock("../../../../../browser/air/utils/getAirStockData.js", () => ({
    getAirStockData: vi.fn(),
}));
vi.mock("../../../../../browser/balun/utils/getBalunStockData.js", () => ({
    getBalunStockData: vi.fn(),
}));
vi.mock("../../../../../browser/yumi/utils/getYumiStockData.js", () => ({
    getYumiStockData: vi.fn(),
}));
vi.mock("../../../../../browser/yumin/utils/getYuminStockData.js", () => ({
    getYuminStockData: vi.fn(),
}));
vi.mock("../../../../../browser/sharte/utils/getSharteStockData.js", () => ({
    getSharteStockData: vi.fn(),
}));
vi.mock("../../../../../browser/perfect/utils/getPerfectStockData.js", () => ({
    getPerfectStockData: vi.fn(),
}));
import { getAirStockData } from "../../../../../browser/air/utils/getAirStockData.js";
import { getSkuStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../getSkuStockDataUtil.js";
const mockGetAirStockData = vi.mocked(getAirStockData);
describe("getSkuStockDataUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        mockGetAirStockData.mockReset();
    });
    it("returns null when sku not found", async () => {
        const result = await getSkuStockDataUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("throws UNSUPPORTED_KONK for unknown konkName", async () => {
        const sku = await Sku.create({
            konkName: "unknown",
            prodName: "p",
            productId: "unknown-1",
            title: "X",
            url: "https://ex.com/x",
        });
        await expect(getSkuStockDataUtil(sku._id.toString())).rejects.toMatchObject({
            code: UNSUPPORTED_KONK_CODE,
        });
    });
    it("calls konk-specific getter and maps stock and price", async () => {
        mockGetAirStockData.mockResolvedValue({ stock: 8, price: 150 });
        const sku = await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-stock-1",
            title: "Item",
            url: "https://air.com/item",
        });
        const result = await getSkuStockDataUtil(sku._id.toString());
        expect(mockGetAirStockData).toHaveBeenCalledWith("https://air.com/item");
        expect(result).toEqual({ stock: 8, price: 150 });
    });
    it("uses -1 when getter omits price", async () => {
        mockGetAirStockData.mockResolvedValue({ stock: 2 });
        const sku = await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-stock-2",
            title: "No price",
            url: "https://air.com/no-price",
        });
        const result = await getSkuStockDataUtil(sku._id.toString());
        expect(result).toEqual({ stock: 2, price: -1 });
    });
});
