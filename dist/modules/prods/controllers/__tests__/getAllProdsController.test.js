import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { getAllProdsController } from "../get-all-prods/getAllProdsController.js";
describe("getAllProdsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Prod.deleteMany({});
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
    it("200 returns empty array when no prods", async () => {
        const req = {};
        await getAllProdsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson.data)).toBe(true);
        expect(responseJson.data.length).toBe(0);
    });
    it("200 returns list of prods", async () => {
        await Prod.create({
            name: "a",
            title: "A",
            imageUrl: "https://a.com/1.png",
        });
        const req = {};
        await getAllProdsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.length).toBe(1);
        expect(responseJson.data[0].name).toBe("a");
    });
});
