import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { getAllDelsController } from "../get-all-dels/getAllDelsController.js";
describe("getAllDelsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Del.deleteMany({});
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
    it("200: returns list without artikuls", async () => {
        await Del.create({
            title: "Delivery 1",
            artikuls: { "ART-1": { quantity: 5 } },
        });
        const req = {};
        await getAllDelsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.length).toBe(1);
        expect(responseJson.data[0].title).toBe("Delivery 1");
        expect(responseJson.data[0]).not.toHaveProperty("artikuls");
    });
});
