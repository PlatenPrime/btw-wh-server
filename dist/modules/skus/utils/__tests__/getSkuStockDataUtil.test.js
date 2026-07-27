import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sku } from "../../models/Sku.js";
import { getAirStockData } from "../../../browser/air/utils/getAirStockData.js";
import { getBalunStockData } from "../../../browser/balun/utils/getBalunStockData.js";
vi.mock("../../../browser/air/utils/getAirStockData.js", () => ({
    getAirStockData: vi.fn(),
}));
vi.mock("../../../browser/balun/utils/getBalunStockData.js", () => ({
    getBalunStockData: vi.fn(),
}));
vi.mock("../../../browser/yumi/utils/getYumiStockData.js", () => ({
    getYumiStockData: vi.fn(),
}));
vi.mock("../../../browser/yumin/utils/getYuminStockData.js", () => ({
    getYuminStockData: vi.fn(),
}));
vi.mock("../../../browser/sharte/utils/getSharteStockData.js", () => ({
    getSharteStockData: vi.fn(),
}));
vi.mock("../../../browser/perfect/utils/getPerfectStockData.js", () => ({
    getPerfectStockData: vi.fn(),
}));
import { getSkuStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../getSkuStockDataUtil.js";
const mockGetBalunStockData = vi.mocked(getBalunStockData);
const mockGetAirStockData = vi.mocked(getAirStockData);
describe("getSkuStockDataUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        mockGetBalunStockData.mockReset();
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
    it("calls getAirStockData for air", async () => {
        mockGetAirStockData.mockResolvedValue({ stock: 4, price: 12.5 });
        const sku = await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-stock-1",
            title: "Item",
            url: "https://air.com/item",
        });
        const result = await getSkuStockDataUtil(sku._id.toString());
        expect(mockGetAirStockData).toHaveBeenCalledWith("https://air.com/item");
        expect(result).toEqual({ stock: 4, price: 12.5 });
    });
    it("calls konk-specific getter and maps stock and price", async () => {
        mockGetBalunStockData.mockResolvedValue({ stock: 8, price: 150 });
        const sku = await Sku.create({
            konkName: "balun",
            prodName: "p",
            productId: "balun-stock-1",
            title: "Item",
            url: "https://balun.com/item",
        });
        const result = await getSkuStockDataUtil(sku._id.toString());
        expect(mockGetBalunStockData).toHaveBeenCalledWith("https://balun.com/item");
        expect(result).toEqual({ stock: 8, price: 150 });
    });
    it("uses -1 when getter omits price", async () => {
        mockGetBalunStockData.mockResolvedValue({ stock: 2 });
        const sku = await Sku.create({
            konkName: "balun",
            prodName: "p",
            productId: "balun-stock-2",
            title: "No price",
            url: "https://balun.com/no-price",
        });
        const result = await getSkuStockDataUtil(sku._id.toString());
        expect(result).toEqual({ stock: 2, price: -1 });
    });
});
