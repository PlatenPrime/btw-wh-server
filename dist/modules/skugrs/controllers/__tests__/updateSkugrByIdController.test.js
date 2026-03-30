import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../models/Skugr.js";
import { updateSkugrByIdController } from "../update-skugr-by-id/updateSkugrByIdController.js";
describe("updateSkugrByIdController", () => {
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
    it("404 when missing", async () => {
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
            body: { title: "X" },
        };
        await updateSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates", async () => {
        const doc = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "Old",
            url: "https://k.com/o",
            skus: [],
        });
        const req = {
            params: { id: doc._id.toString() },
            body: { title: "New" },
        };
        await updateSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("New");
    });
    it("200 updates isSliced", async () => {
        const doc = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "Old 2",
            url: "https://k.com/o2",
            skus: [],
            isSliced: true,
        });
        const req = {
            params: { id: doc._id.toString() },
            body: { isSliced: false },
        };
        await updateSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.isSliced).toBe(false);
    });
});
