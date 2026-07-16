import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Sku } from "../../models/Sku.js";
import { createSkuController } from "../create-sku/createSkuController.js";
describe("createSkuController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
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
    it("400 when required fields are missing", async () => {
        const req = { body: { konkName: "k1" } };
        await createSkuController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates sku and returns data", async () => {
        const req = {
            body: {
                konkName: "k1",
                prodName: "p1",
                productId: "k1-create-ctrl",
                title: "Sku 1",
                url: "https://k1.com/sku-1",
            },
        };
        await createSkuController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.title).toBe("Sku 1");
        expect(await Sku.countDocuments()).toBe(1);
    });
    it("201 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `sku-event-${Date.now()}` });
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
            body: {
                konkName: "k1",
                prodName: "p1",
                productId: "k1-create-event",
                title: "Sku Audited",
                url: "https://k1.com/sku-audited",
            },
        };
        await createSkuController(req, res);
        expect(responseStatus.code).toBe(201);
        const events = await Event.find({ department: "skus" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
