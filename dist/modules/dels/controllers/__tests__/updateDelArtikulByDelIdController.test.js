import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { getSharikStockData } from "../../../browser/sharik/utils/getSharikStockData.js";
import { Event } from "../../../events/models/Event.js";
import { Del } from "../../models/Del.js";
import { updateDelArtikulByDelIdController } from "../update-del-artikul-by-del-id/updateDelArtikulByDelIdController.js";
vi.mock("../../../browser/sharik/utils/getSharikStockData.js");
describe("updateDelArtikulByDelIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        vi.clearAllMocks();
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
    it("404 when del or product not found", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { "ART-1": { quant: 5 } },
        });
        vi.mocked(getSharikStockData).mockResolvedValue(null);
        const req = {
            params: { id: del._id.toString(), artikul: "ART-1" },
        };
        await updateDelArtikulByDelIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates stock and returns del preserving quant", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { "ART-1": { quant: 5 } },
        });
        vi.mocked(getSharikStockData).mockResolvedValue({
            nameukr: "Товар",
            price: 100,
            quantity: 15,
        });
        const req = {
            params: { id: del._id.toString(), artikul: "ART-1" },
        };
        await updateDelArtikulByDelIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        const artikuls = data?.toObject?.()?.artikuls ?? data?.artikuls ?? {};
        expect(artikuls["ART-1"]).toEqual({
            quant: 5,
            stock: 15,
            nameukr: "Товар",
        });
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `del-artikul-event-${Date.now()}` });
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { "ART-1": { quant: 5 } },
        });
        vi.mocked(getSharikStockData).mockResolvedValue({
            nameukr: "Товар",
            price: 100,
            quantity: 15,
        });
        const req = {
            user: { id: String(user._id), role: "ADMIN" },
            params: { id: del._id.toString(), artikul: "ART-1" },
        };
        await updateDelArtikulByDelIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "dels" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(String(user._id));
        expect(events[0].description).toBe(`Оновлено артикул ART-1 у поставці "Del" (id: ${del._id})`);
    });
});
