import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Skugr } from "../../models/Skugr.js";
import { setIsSlicedController } from "../set-is-sliced/setIsSlicedController.js";
describe("setIsSlicedController", () => {
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
    it("200 sets isSliced=true only for docs without the field", async () => {
        await Skugr.collection.insertMany([
            {
                konkName: "k1",
                prodName: "p1",
                title: "Needs backfill",
                url: "https://k.com/1",
                skus: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                konkName: "k1",
                prodName: "p1",
                title: "Already false",
                url: "https://k.com/2",
                skus: [],
                isSliced: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        const req = {};
        await setIsSlicedController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.matchedCount).toBe(1);
        expect(data.modifiedCount).toBe(1);
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `skugr-sliced-event-${Date.now()}` });
        await Skugr.collection.insertMany([
            {
                konkName: "k1",
                prodName: "p1",
                title: "Needs backfill",
                url: "https://k.com/1-event",
                skus: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
        };
        await setIsSlicedController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "skugrs" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
