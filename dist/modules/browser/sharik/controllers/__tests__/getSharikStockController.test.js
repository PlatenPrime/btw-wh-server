import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikStockController } from "../getSharikStockController.js";
import { getSharikStockData } from "../../utils/getSharikStockData.js";
vi.mock("../../utils/getSharikStockData.js");
describe("getSharikStockController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        vi.mocked(getSharikStockData).mockReset();
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
    it("400 when artikul invalid (empty)", async () => {
        const req = { params: { artikul: "" } };
        await getSharikStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(getSharikStockData).not.toHaveBeenCalled();
    });
    it("404 when product not found", async () => {
        vi.mocked(getSharikStockData).mockResolvedValue(null);
        const req = { params: { artikul: "ART-1" } };
        await getSharikStockController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Товар не найден");
    });
    it("200 returns stock data", async () => {
        const mockData = {
            nameukr: "Товар",
            price: 100,
            quantity: 15,
        };
        vi.mocked(getSharikStockData).mockResolvedValue(mockData);
        const req = { params: { artikul: "ART-1" } };
        await getSharikStockController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Sharik stock retrieved successfully");
        expect(responseJson.data).toEqual(mockData);
    });
});
