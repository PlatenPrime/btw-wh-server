import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../models/Art.js";
import { getAllArtsController } from "../get-all-arts/getAllArtsController.js";
describe("getAllArtsController", () => {
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
    });
    it("200: возвращает все артикулы с пагинацией", async () => {
        await Art.create({ artikul: "ART-001", zone: "A1" });
        await Art.create({ artikul: "ART-002", zone: "A2" });
        const req = { query: { page: "1", limit: "10" } };
        await getAllArtsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson.data)).toBe(true);
        expect(responseJson.total).toBe(2);
        expect(responseJson.page).toBe(1);
        expect(responseJson.totalPages).toBe(1);
    });
    it("200: возвращает артикулы с поиском", async () => {
        await Art.create({ artikul: "SEARCH-001", zone: "A1" });
        const req = { query: { search: "search" } };
        await getAllArtsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toHaveLength(1);
    });
    it("400: ошибка валидации при невалидных параметрах", async () => {
        const req = { query: { page: "-1" } };
        await getAllArtsController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid query parameters");
    });
});
