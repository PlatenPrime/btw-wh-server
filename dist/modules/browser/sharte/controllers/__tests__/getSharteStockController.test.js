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
    it("400 when id invalid (empty)", async () => {
        const req = { params: { id: "" } };
        await getSharteStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(getSharteStockData).not.toHaveBeenCalled();
    });
    it("404 when product not found", async () => {
        vi.mocked(getSharteStockData).mockResolvedValue(null);
        const req = { params: { id: "4777" } };
        await getSharteStockController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Товар не найден или данные скрыты");
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
        const req = { params: { id: "4777" } };
        await getSharteStockController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Sharte stock retrieved successfully");
        expect(responseJson.data).toEqual(mockStock);
    });
});
