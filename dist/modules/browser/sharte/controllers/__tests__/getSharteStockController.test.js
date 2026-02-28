import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharteStockController } from "../getSharteStockController.js";
import { getSharteStockData } from "../../utils/getSharteStockData.js";
vi.mock("../../utils/getSharteStockData.js");
describe("getSharteStockController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        vi.mocked(getSharteStockData).mockReset();
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
    it("400 when url is missing", async () => {
        const req = { params: {}, query: {} };
        await getSharteStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(getSharteStockData).not.toHaveBeenCalled();
    });
    it("400 when url is invalid", async () => {
        const req = {
            params: {},
            query: { url: "not-a-valid-url" },
        };
        await getSharteStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(getSharteStockData).not.toHaveBeenCalled();
    });
    it("404 when product not found", async () => {
        vi.mocked(getSharteStockData).mockResolvedValue({
            id: "4777",
            name: "",
            stock: -1,
            reserved: 0,
            available: -1,
            price: -1,
        });
        const productUrl = "https://sharte.net/catalog/product/4777/";
        const req = { params: {}, query: { url: productUrl } };
        await getSharteStockController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Товар не найден или данные скрыты");
        expect(getSharteStockData).toHaveBeenCalledWith(productUrl);
    });
    it("200 returns stock data", async () => {
        const mockStock = {
            id: "4777",
            name: "Test Product",
            stock: 10,
            reserved: 1,
            available: 9,
        };
        vi.mocked(getSharteStockData).mockResolvedValue(mockStock);
        const productUrl = "https://sharte.net/catalog/product/4777/";
        const req = { params: {}, query: { url: productUrl } };
        await getSharteStockController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Sharte stock retrieved successfully");
        expect(responseJson.data).toEqual(mockStock);
        expect(getSharteStockData).toHaveBeenCalledWith(productUrl);
    });
});
