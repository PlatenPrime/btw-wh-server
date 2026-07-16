import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";
import { deleteSkugrWithSkusController } from "../deleteSkugrWithSkusController.js";
describe("deleteSkugrWithSkusController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
        await Event.deleteMany({});
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
        };
        await deleteSkugrWithSkusController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes skugr and skus", async () => {
        const sku = await Sku.create({
            konkName: "kdw",
            prodName: "pdw",
            productId: "kdw-1",
            title: "S",
            url: "https://kdw.com/1",
        });
        const g = await Skugr.create({
            konkName: "kdw",
            prodName: "pdw",
            title: "G",
            url: "https://kdw.com/g",
            skus: [sku._id],
        });
        const req = { params: { id: g._id.toString() } };
        await deleteSkugrWithSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.deletedSkusCount).toBe(1);
        expect(await Skugr.findById(g._id)).toBeNull();
        expect(await Sku.findById(sku._id)).toBeNull();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `skugr-with-skus-event-${Date.now()}` });
        const sku = await Sku.create({
            konkName: "kdw2",
            prodName: "pdw",
            productId: "kdw2-1",
            title: "S",
            url: "https://kdw2.com/1",
        });
        const g = await Skugr.create({
            konkName: "kdw2",
            prodName: "pdw",
            title: "G",
            url: "https://kdw2.com/g",
            skus: [sku._id],
        });
        const req = {
            params: { id: g._id.toString() },
            user: { id: user._id.toString(), role: "PRIME" },
        };
        await deleteSkugrWithSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "skugrs" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
