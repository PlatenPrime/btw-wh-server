import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Del } from "../../models/Del.js";
import { Prod } from "../../../prods/models/Prod.js";
import { updateDelTitleByIdController } from "../update-del-title-by-id/updateDelTitleByIdController.js";
describe("updateDelTitleByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Del.deleteMany({});
        await Prod.deleteMany({});
        await Event.deleteMany({});
        await Prod.create({
            name: "acme",
            title: "Acme",
            imageUrl: "https://example.com/acme.png",
        });
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
    it("400 when validation fails", async () => {
        const req = {
            params: { id: "invalid-id" },
            body: { title: "New", prodName: "acme" },
        };
        await updateDelTitleByIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404 when del not found", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { title: "New", prodName: "acme" },
        };
        await updateDelTitleByIdController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Del not found");
    });
    it("400 when prodName does not exist", async () => {
        const del = await Del.create({
            title: "Old",
            prodName: "acme",
            artikuls: {},
        });
        const req = {
            params: { id: del._id.toString() },
            body: { title: "New", prodName: "nonexistent" },
        };
        await updateDelTitleByIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Производитель с указанным name не найден");
    });
    it("200 updates del title", async () => {
        const del = await Del.create({
            title: "Old title",
            prodName: "acme",
            artikuls: {},
        });
        const req = {
            params: { id: del._id.toString() },
            body: { title: "New title", prodName: "acme" },
        };
        await updateDelTitleByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Del title updated successfully");
        expect(responseJson.data.title).toBe("New title");
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `del-title-event-${Date.now()}` });
        const del = await Del.create({
            title: "Old title",
            prodName: "acme",
            artikuls: {},
        });
        const req = {
            user: { id: String(user._id), role: "ADMIN" },
            params: { id: del._id.toString() },
            body: { title: "Audited title", prodName: "acme" },
        };
        await updateDelTitleByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "dels" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(String(user._id));
        expect(events[0].description).toBe(`Оновлено назву поставки на "Audited title" (виробник: acme, id: ${del._id})`);
    });
});
