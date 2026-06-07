import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAirStockController } from "../getAirStockController.js";
import { getAirStockData } from "../../utils/getAirStockData.js";
vi.mock("../../utils/getAirStockData.js");
describe("getAirStockController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        vi.mocked(getAirStockData).mockReset();
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
    it("400 when link invalid (empty)", async () => {
        const req = { query: { link: "" } };
        await getAirStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(getAirStockData).not.toHaveBeenCalled();
    });
    it("404 when product not found", async () => {
        vi.mocked(getAirStockData).mockResolvedValue({ stock: -1, price: -1 });
        const req = {
            query: { link: "https://example.com/product/1" },
        };
        await getAirStockController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Товар не найден или данные недоступны");
    });
    it("200 returns stock data", async () => {
        const mockData = { stock: 10, price: 2.5, title: "Air product" };
        vi.mocked(getAirStockData).mockResolvedValue(mockData);
        const req = {
            query: { link: "https://example.com/product/2" },
        };
        await getAirStockController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Air stock retrieved successfully");
        expect(responseJson.data).toEqual(mockData);
    });
    it("500 when service throws", async () => {
        vi.mocked(getAirStockData).mockRejectedValue(new Error("Service error"));
        const req = {
            query: { link: "https://example.com/product/3" },
        };
        await getAirStockController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
});
