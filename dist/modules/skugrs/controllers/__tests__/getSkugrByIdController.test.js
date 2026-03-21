import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../models/Skugr.js";
import { getSkugrByIdController } from "../get-skugr-by-id/getSkugrByIdController.js";
describe("getSkugrByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Skugr.deleteMany({});
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
    it("400 on invalid id", async () => {
        const req = { params: { id: "not-an-objectid" } };
        await getSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when skugr not found", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await getSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 with empty skus array", async () => {
        const skugr = await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "G",
            url: "https://k1.com/g-empty",
            skus: [],
        });
        const req = {
            params: { id: skugr._id.toString() },
        };
        await getSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.title).toBe("G");
        expect(data.skus).toEqual([]);
    });
    it("200 returns skus in group order", async () => {
        const skuA = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-skugr-get-a",
            title: "A",
            url: "https://k1.com/a-order",
        });
        const skuB = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-skugr-get-b",
            title: "B",
            url: "https://k1.com/b-order",
        });
        const skugr = await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "Ordered",
            url: "https://k1.com/g-order",
            skus: [skuB._id, skuA._id],
        });
        const req = {
            params: { id: skugr._id.toString() },
        };
        await getSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.skus.map((s) => s.title)).toEqual(["B", "A"]);
    });
    it("skips missing sku documents but keeps order for the rest", async () => {
        const skuOk = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-skugr-get-ok",
            title: "Ok",
            url: "https://k1.com/orphan-ok",
        });
        const ghostId = new mongoose.Types.ObjectId();
        const skugr = await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "Orphan",
            url: "https://k1.com/g-orphan",
            skus: [ghostId, skuOk._id],
        });
        const req = {
            params: { id: skugr._id.toString() },
        };
        await getSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.skus).toHaveLength(1);
        expect(data.skus[0].title).toBe("Ok");
    });
});
