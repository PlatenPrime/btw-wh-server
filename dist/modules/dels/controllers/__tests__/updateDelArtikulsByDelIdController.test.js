import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { getSharikStockData } from "../../../browser/sharik/utils/getSharikStockData.js";
import { Event } from "../../../events/models/Event.js";
import { Del } from "../../models/Del.js";
import { updateDelArtikulsByDelIdController } from "../update-del-artikuls-by-del-id/updateDelArtikulsByDelIdController.js";
vi.mock("../../../browser/sharik/utils/getSharikStockData.js");
describe("updateDelArtikulsByDelIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(getSharikStockData).mockResolvedValue(null);
        await Del.deleteMany({});
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
    it("404 when del not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await updateDelArtikulsByDelIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("202 when del found and process started", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { A1: { quant: 0 } },
        });
        const req = { params: { id: del._id.toString() } };
        await updateDelArtikulsByDelIdController(req, res);
        expect(responseStatus.code).toBe(202);
        expect(responseJson.message).toContain("started");
    });
    it("202 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `del-artikuls-event-${Date.now()}` });
        const del = await Del.create({
            title: "Del with artikuls",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { A1: { quant: 0 } },
        });
        const req = {
            user: { id: String(user._id), role: "ADMIN" },
            params: { id: del._id.toString() },
        };
        await updateDelArtikulsByDelIdController(req, res);
        expect(responseStatus.code).toBe(202);
        const events = await Event.find({ department: "dels" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(String(user._id));
        expect(events[0].description).toBe(`Запущено оновлення всіх артикулів поставки "Del with artikuls" (id: ${del._id})`);
    });
});
