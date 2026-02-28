import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYumiStockController } from "../getYumiStockController.js";
import { getYumiStockData } from "../../utils/getYumiStockData.js";
vi.mock("../../utils/getYumiStockData.js");
describe("getYumiStockController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        vi.mocked(getYumiStockData).mockReset();
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
        await getYumiStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(getYumiStockData).not.toHaveBeenCalled();
    });
    it("404 when product not found", async () => {
        vi.mocked(getYumiStockData).mockResolvedValue({ stock: -1, price: -1 });
        const req = {
            query: { link: "https://example.com/product/1" },
        };
        await getYumiStockController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Товар не найден или данные недоступны");
        expect(getYumiStockData).toHaveBeenCalledWith("https://example.com/product/1");
    });
    it("200 returns stock data", async () => {
        const mockData = {
            stock: 10,
            price: 2.5,
            title: "Test product",
        };
        vi.mocked(getYumiStockData).mockResolvedValue(mockData);
        const req = {
            query: { link: "https://example.com/product/2" },
        };
        await getYumiStockController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Yumi stock retrieved successfully");
        expect(responseJson.data).toEqual(mockData);
        expect(getYumiStockData).toHaveBeenCalledWith("https://example.com/product/2");
    });
    it("500 when service throws", async () => {
        vi.mocked(getYumiStockData).mockRejectedValue(new Error("Service error"));
        const req = {
            query: { link: "https://example.com/product/3" },
        };
        await getYumiStockController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
});
