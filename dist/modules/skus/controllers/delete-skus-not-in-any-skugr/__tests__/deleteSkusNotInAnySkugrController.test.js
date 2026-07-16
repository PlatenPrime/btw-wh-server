import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
import { deleteSkusNotInAnySkugrController } from "../deleteSkusNotInAnySkugrController.js";
describe("deleteSkusNotInAnySkugrController", () => {
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
    it("400 on invalid query", async () => {
        const req = { query: { isInvalid: "maybe" } };
        await deleteSkusNotInAnySkugrController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 returns deletedCount", async () => {
        await Sku.create({
            konkName: "kdn",
            prodName: "pdn",
            productId: "kdn-1",
            title: "O",
            url: "https://kdn.com/1",
        });
        const req = { query: {} };
        await deleteSkusNotInAnySkugrController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.deletedCount).toBe(1);
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `sku-not-in-skugr-event-${Date.now()}` });
        await Sku.create({
            konkName: "kdn2",
            prodName: "pdn",
            productId: "kdn2-1",
            title: "O",
            url: "https://kdn2.com/1",
        });
        const req = {
            query: {},
            user: { id: user._id.toString(), role: "ADMIN" },
        };
        await deleteSkusNotInAnySkugrController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "skus" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
