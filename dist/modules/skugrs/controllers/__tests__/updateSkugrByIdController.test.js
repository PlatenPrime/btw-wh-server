import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Skugr } from "../../models/Skugr.js";
import { updateSkugrByIdController } from "../update-skugr-by-id/updateSkugrByIdController.js";
describe("updateSkugrByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
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
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `skugr-update-event-${Date.now()}` });
        const doc = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "Old",
            url: "https://k.com/o-event",
            skus: [],
        });
        const req = {
            params: { id: doc._id.toString() },
            body: { title: "New" },
            user: { id: user._id.toString(), role: "ADMIN" },
        };
        await updateSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "skugrs" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
