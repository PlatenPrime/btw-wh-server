import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBtradeArtInfoController } from "../get-btrade-art-info/getBtradeArtInfoController.js";
import * as utils from "../../../../utils/index.js";
describe("getBtradeArtInfoController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
        };
        vi.clearAllMocks();
    });
    it("200: возвращает данные из внешнего API", async () => {
        const mockData = {
            nameukr: "Тест товар",
            price: 100,
            quantity: 10,
        };
        vi.spyOn(utils, "getSharikData").mockResolvedValue(mockData);
        const req = { params: { artikul: "TEST-001" } };
        await getBtradeArtInfoController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson).toEqual(mockData);
    });
    it("404: возвращает ошибку если товар не найден", async () => {
        vi.spyOn(utils, "getSharikData").mockResolvedValue(null);
        const req = { params: { artikul: "NONEXISTENT" } };
        await getBtradeArtInfoController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("No products found for this artikul");
    });
    it("400: ошибка валидации при пустом artikul", async () => {
        const req = { params: { artikul: "" } };
        await getBtradeArtInfoController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Artikul is required");
    });
    it("500: обрабатывает ошибки API", async () => {
        vi.spyOn(utils, "getSharikData").mockRejectedValue(new Error("Network error"));
        const req = { params: { artikul: "ERROR-ART" } };
        await getBtradeArtInfoController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Failed to fetch data from sharik.ua");
    });
});
