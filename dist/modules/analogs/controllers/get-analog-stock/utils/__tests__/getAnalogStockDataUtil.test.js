import { beforeEach, describe, expect, it, vi } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { getAirStockData } from "../../../../../browser/air/utils/getAirStockData.js";
import { getBalunStockData } from "../../../../../browser/balun/utils/getBalunStockData.js";
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
import { getAnalogStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../getAnalogStockDataUtil.js";
const mockGetBalunStockData = vi.mocked(getBalunStockData);
const mockGetAirStockData = vi.mocked(getAirStockData);
describe("getAnalogStockDataUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
        mockGetBalunStockData.mockReset();
        mockGetAirStockData.mockReset();
    });
    it("returns null when analog not found", async () => {
        const result = await getAnalogStockDataUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("throws UNSUPPORTED_KONK for unknown konkName", async () => {
        const analog = await Analog.create({
            konkName: "unknown-shop",
            prodName: "p",
            url: "https://ex.com/p",
            artikul: "A1",
        });
        await expect(getAnalogStockDataUtil(analog._id.toString())).rejects.toMatchObject({ code: UNSUPPORTED_KONK_CODE });
    });
    it("calls getAirStockData for air", async () => {
        mockGetAirStockData.mockResolvedValue({ stock: 7, price: 3.5 });
        const analog = await Analog.create({
            konkName: "Air",
            prodName: "p",
            url: "https://air.com/item",
            artikul: "A2",
        });
        const result = await getAnalogStockDataUtil(analog._id.toString());
        expect(mockGetAirStockData).toHaveBeenCalledWith("https://air.com/item");
        expect(result).toEqual({ stock: 7, price: 3.5 });
    });
    it("calls konk-specific getter and maps stock and price", async () => {
        mockGetBalunStockData.mockResolvedValue({ stock: 5, price: 99 });
        const analog = await Analog.create({
            konkName: "Balun",
            prodName: "p",
            url: "https://balun.com/item",
            artikul: "A2",
        });
        const result = await getAnalogStockDataUtil(analog._id.toString());
        expect(mockGetBalunStockData).toHaveBeenCalledWith("https://balun.com/item");
        expect(result).toEqual({ stock: 5, price: 99 });
    });
    it("uses -1 when getter omits price", async () => {
        mockGetBalunStockData.mockResolvedValue({ stock: 3 });
        const analog = await Analog.create({
            konkName: "balun",
            prodName: "p",
            url: "https://balun.com/no-price",
            artikul: "A3",
        });
        const result = await getAnalogStockDataUtil(analog._id.toString());
        expect(result).toEqual({ stock: 3, price: -1 });
    });
});
