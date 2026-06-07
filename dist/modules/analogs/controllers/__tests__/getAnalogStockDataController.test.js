import { beforeEach, describe, expect, it, vi } from "vitest";
import { Analog } from "../../models/Analog.js";
vi.mock("../get-analog-stock/utils/getAnalogStockDataUtil.js", () => ({
    getAnalogStockDataUtil: vi.fn(),
    UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));
import { getAnalogStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../get-analog-stock/utils/getAnalogStockDataUtil.js";
import { getAnalogStockDataController } from "../get-analog-stock/getAnalogStockDataController.js";
const mockGetStock = vi.mocked(getAnalogStockDataUtil);
describe("getAnalogStockDataController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Analog.deleteMany({});
        mockGetStock.mockReset();
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
    });
    it("400 when id invalid", async () => {
        const req = { params: { id: "bad" } };
        await getAnalogStockDataController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when konk unsupported", async () => {
        const analog = await Analog.create({
            konkName: "x",
            prodName: "p",
            url: "https://ex.com/x",
            artikul: "A",
        });
        const err = new Error("unsupported");
        err.code = UNSUPPORTED_KONK_CODE;
        mockGetStock.mockRejectedValue(err);
        const req = {
            params: { id: analog._id.toString() },
        };
        await getAnalogStockDataController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Unsupported competitor for stock");
    });
    it("404 when analog not found", async () => {
        mockGetStock.mockResolvedValue(null);
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getAnalogStockDataController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("404 when stock and price are -1", async () => {
        mockGetStock.mockResolvedValue({ stock: -1, price: -1 });
        const req = {
            params: { id: "000000000000000000000001" },
        };
        await getAnalogStockDataController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns stock data", async () => {
        mockGetStock.mockResolvedValue({ stock: 10, price: 50 });
        const req = {
            params: { id: "000000000000000000000002" },
        };
        await getAnalogStockDataController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toEqual({ stock: 10, price: 50 });
    });
});
