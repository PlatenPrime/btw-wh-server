import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYuminStockController } from "../getYuminStockController.js";
import { getYuminStockData } from "../../utils/getYuminStockData.js";
vi.mock("../../utils/getYuminStockData.js");
describe("getYuminStockController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        vi.mocked(getYuminStockData).mockReset();
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
        await getYuminStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(getYuminStockData).not.toHaveBeenCalled();
    });
    it("404 when product not found", async () => {
        vi.mocked(getYuminStockData).mockResolvedValue({ stock: -1, price: -1 });
        const req = {
            query: { link: "https://example.com/product/1" },
        };
        await getYuminStockController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Товар не найден или данные недоступны");
        expect(getYuminStockData).toHaveBeenCalledWith("https://example.com/product/1");
    });
    it("200 returns stock data", async () => {
        const mockData = {
            stock: 10,
            price: 2.5,
            title: "Test product",
        };
        vi.mocked(getYuminStockData).mockResolvedValue(mockData);
        const req = {
            query: { link: "https://example.com/product/2" },
        };
        await getYuminStockController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Yumin stock retrieved successfully");
        expect(responseJson.data).toEqual(mockData);
        expect(getYuminStockData).toHaveBeenCalledWith("https://example.com/product/2");
    });
    it("500 when service throws", async () => {
        vi.mocked(getYuminStockData).mockRejectedValue(new Error("Service error"));
        const req = {
            query: { link: "https://example.com/product/3" },
        };
        await getYuminStockController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
});
