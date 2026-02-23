import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { getAllKonksController } from "../get-all-konks/getAllKonksController.js";
describe("getAllKonksController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Konk.deleteMany({});
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
    it("200 returns empty array when no konks", async () => {
        const req = {};
        await getAllKonksController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson.data)).toBe(true);
        expect(responseJson.data.length).toBe(0);
    });
    it("200 returns list of konks", async () => {
        await Konk.create({
            name: "a",
            title: "A",
            url: "https://a.com",
            imageUrl: "https://a.com/1.png",
        });
        const req = {};
        await getAllKonksController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.length).toBe(1);
        expect(responseJson.data[0].name).toBe("a");
    });
});
