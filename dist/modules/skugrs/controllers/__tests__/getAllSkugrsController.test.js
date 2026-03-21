import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../models/Skugr.js";
import { getAllSkugrsController } from "../get-all-skugrs/getAllSkugrsController.js";
describe("getAllSkugrsController", () => {
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
    it("400 for invalid query", async () => {
        const req = { query: { page: "0" } };
        await getAllSkugrsController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 with filters", async () => {
        await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "One",
            url: "https://k.com/1",
            skus: [],
        });
        await Skugr.create({
            konkName: "k2",
            prodName: "p1",
            title: "Two",
            url: "https://k.com/2",
            skus: [],
        });
        const req = {
            query: { page: "1", limit: "10", konkName: "k1", prodName: "p1" },
        };
        await getAllSkugrsController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data).toHaveLength(1);
        expect(responseJson.pagination.total).toBe(1);
    });
});
