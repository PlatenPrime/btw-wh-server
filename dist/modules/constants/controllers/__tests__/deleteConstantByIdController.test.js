import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Constant } from "../../models/Constant.js";
import { deleteConstantByIdController } from "../delete-constant-by-id/deleteConstantByIdController.js";
describe("deleteConstantByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Constant.deleteMany({});
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
    it("400 when id invalid", async () => {
        const req = { params: { id: "invalid" } };
        await deleteConstantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when constant not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteConstantByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes constant", async () => {
        const constant = await Constant.create({
            name: "to-delete",
            title: "To Delete",
            data: {},
        });
        const req = { params: { id: constant._id.toString() } };
        await deleteConstantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Constant.findById(constant._id);
        expect(found).toBeNull();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({
            username: `del-event-${Date.now()}`,
        });
        const constant = await Constant.create({
            name: "gone",
            title: "Gone",
            data: {},
        });
        const req = {
            user: { id: user._id.toString(), role: "PRIME" },
            params: { id: constant._id.toString() },
        };
        await deleteConstantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "constants" });
        expect(events).toHaveLength(1);
        expect(events[0].description).toContain("Видалено константу");
        expect(events[0].description).toContain("name=gone");
    });
});
