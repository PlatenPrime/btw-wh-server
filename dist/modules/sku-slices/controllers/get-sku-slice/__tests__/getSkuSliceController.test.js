import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceController } from "../getSkuSliceController.js";
describe("getSkuSliceController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await SkuSlice.deleteMany({});
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
    it("400 when query invalid", async () => {
        const req = { query: {} };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404 when slice missing", async () => {
        const req = {
            query: { konkName: "air", date: "2026-03-01" },
        };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns items and pagination with sku mapping", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-1",
            title: "T",
            url: "https://example.com/p1",
        });
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-01T00:00:00.000Z"),
            data: { "air-1": { stock: 2, price: 5 } },
        });
        const req = {
            query: { konkName: "air", date: "2026-03-01" },
        };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.konkName).toBe("air");
        const items = data.items;
        expect(items).toHaveLength(1);
        expect(items[0].productId).toBe("air-1");
        expect(items[0].stock).toBe(2);
        expect(items[0].sku).not.toBeNull();
        expect(items[0].sku._id.toString()).toBe(sku._id.toString());
        const pagination = responseJson.pagination;
        expect(pagination.total).toBe(1);
        expect(pagination.page).toBe(1);
        expect(pagination.limit).toBe(10);
        expect(pagination.totalPages).toBe(1);
    });
    it("200 with isInvalid true returns only invalid slice rows", async () => {
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-01T00:00:00.000Z"),
            data: {
                "air-ok": { stock: 1, price: 1 },
                "air-bad": { stock: -1, price: -1 },
            },
        });
        const req = {
            query: { konkName: "air", date: "2026-03-01", isInvalid: "true" },
        };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.items.map((i) => i.productId)).toEqual(["air-bad"]);
        const pagination = responseJson.pagination;
        expect(pagination.total).toBe(1);
    });
    it("200 respects page and limit", async () => {
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-01T00:00:00.000Z"),
            data: {
                "air-1": { stock: 1, price: 1 },
                "air-2": { stock: 2, price: 2 },
                "air-3": { stock: 3, price: 3 },
            },
        });
        const req = {
            query: {
                konkName: "air",
                date: "2026-03-01",
                page: "2",
                limit: "2",
            },
        };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.items.map((i) => i.productId)).toEqual(["air-3"]);
        const pagination = responseJson.pagination;
        expect(pagination.total).toBe(3);
        expect(pagination.page).toBe(2);
    });
});
