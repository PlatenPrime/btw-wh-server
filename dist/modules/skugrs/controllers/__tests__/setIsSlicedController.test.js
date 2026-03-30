import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../models/Skugr.js";
import { setIsSlicedController } from "../set-is-sliced/setIsSlicedController.js";
describe("setIsSlicedController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Skugr.deleteMany({});
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
    it("200 sets isSliced=true only for docs without the field", async () => {
        await Skugr.collection.insertMany([
            {
                konkName: "k1",
                prodName: "p1",
                title: "Needs backfill",
                url: "https://k.com/1",
                skus: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                konkName: "k1",
                prodName: "p1",
                title: "Already false",
                url: "https://k.com/2",
                skus: [],
                isSliced: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        const req = {};
        await setIsSlicedController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.matchedCount).toBe(1);
        expect(data.modifiedCount).toBe(1);
    });
});
