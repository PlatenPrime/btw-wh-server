import { beforeEach, describe, expect, it } from "vitest";
import { Row } from "../../models/Row.js";
import { updateRow } from "../update-row/updateRow.js";
describe("updateRowController", () => {
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
    it("200: обновляет ряд", async () => {
        const row = await Row.create({ title: "Old Title" });
        const req = {
            params: { id: row._id.toString() },
            body: { title: "New Title" },
        };
        await updateRow(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.title).toBe("New Title");
        expect(responseJson._id.toString()).toBe(row._id.toString());
    });
    it("404: когда ряд не найден", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { title: "Any Title" },
        };
        await updateRow(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Row not found");
    });
    it("400: ошибка валидации при невалидном ID", async () => {
        const req = {
            params: { id: "invalid-id" },
            body: { title: "Any Title" },
        };
        await updateRow(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при пустом title", async () => {
        const row = await Row.create({ title: "Test" });
        const req = {
            params: { id: row._id.toString() },
            body: { title: "" },
        };
        await updateRow(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("500: внутренняя ошибка при нарушении уникальности", async () => {
        const row1 = await Row.create({ title: "Unique 1" });
        const row2 = await Row.create({ title: "Unique 2" });
        const req = {
            params: { id: row2._id.toString() },
            body: { title: "Unique 1" },
        };
        await updateRow(req, res);
        expect(responseStatus.code).toBe(500);
    });
});
