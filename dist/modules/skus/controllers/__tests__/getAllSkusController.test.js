import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { getAllSkusController } from "../get-all-skus/getAllSkusController.js";
describe("getAllSkusController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
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
    it("400 for invalid query params", async () => {
        const req = { query: { page: "0", limit: "10" } };
        await getAllSkusController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 returns filtered and paginated data", async () => {
        await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-6",
            title: "Wanted",
            url: "https://k1.com/wanted",
        });
        await Sku.create({
            konkName: "k2",
            prodName: "p2",
            productId: "k2-1",
            title: "Other",
            url: "https://k2.com/other",
        });
        const req = {
            query: { page: "1", limit: "10", konkName: "k1", prodName: "p1" },
        };
        await getAllSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toHaveLength(1);
        expect(responseJson.pagination.total).toBe(1);
    });
});
