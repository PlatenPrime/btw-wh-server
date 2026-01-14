import { beforeEach, describe, expect, it } from "vitest";
import { getAsksByArt } from "../get-asks-by-artikul/getAsksByArt.js";
import { createTestAsk } from "../../../../test/setup.js";
describe("getAsksByArt", () => {
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
    it("200: возвращает заявки указанного артикула и статистику", async () => {
        await createTestAsk({ artikul: "ART-TEST", status: "new" });
        await createTestAsk({ artikul: "ART-TEST", status: "completed" });
        await createTestAsk({ artikul: "ART-TEST", status: "processing" });
        await createTestAsk({ artikul: "ART-OTHER", status: "new" });
        const req = { query: { artikul: "ART-TEST" } };
        await getAsksByArt(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.count).toBe(3);
        expect(responseJson.newCount).toBe(1);
        expect(responseJson.completedCount).toBe(1);
        expect(responseJson.processingCount).toBe(1);
        expect(responseJson.rejectedCount).toBe(0);
        expect(responseJson.artikul).toBe("ART-TEST");
        expect(responseJson.data).toBeInstanceOf(Array);
        expect(responseJson.data.length).toBe(3);
        expect(responseJson.data.every((ask) => ask.artikul === "ART-TEST")).toBe(true);
    });
    it("400: ошибка валидации при отсутствии artikul", async () => {
        const req = { query: {} };
        await getAsksByArt(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при пустом artikul", async () => {
        const req = { query: { artikul: "" } };
        await getAsksByArt(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
