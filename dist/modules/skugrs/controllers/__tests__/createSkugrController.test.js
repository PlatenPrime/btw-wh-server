import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../models/Skugr.js";
import { createSkugrController } from "../create-skugr/createSkugrController.js";
describe("createSkugrController", () => {
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
    it("400 on validation error", async () => {
        const req = { body: { title: "" } };
        await createSkugrController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates skugr", async () => {
        const req = {
            body: {
                konkName: "k1",
                prodName: "p1",
                title: "Group",
                url: "https://k1.com/g",
                skus: [],
            },
        };
        await createSkugrController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.title).toBe("Group");
    });
    it("400 when sku id invalid reference", async () => {
        const req = {
            body: {
                konkName: "k1",
                prodName: "p1",
                title: "Group",
                url: "https://k1.com/g2",
                skus: ["507f1f77bcf86cd799439011"],
            },
        };
        await createSkugrController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 with valid sku ids", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            title: "S",
            url: "https://k1.com/s-only",
        });
        const req = {
            body: {
                konkName: "k1",
                prodName: "p1",
                title: "Group",
                url: "https://k1.com/g3",
                skus: [sku._id.toString()],
            },
        };
        await createSkugrController(req, res);
        expect(responseStatus.code).toBe(201);
        const data = responseJson.data;
        expect(data.skus).toEqual([sku._id.toString()]);
    });
});
