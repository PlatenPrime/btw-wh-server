import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import * as updateUtil from "../../utils/updateBtradeStockUtil.js";
import { updateBtradeStockController } from "../update-btrade-stock/updateBtradeStockController.js";
describe("updateBtradeStockController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
        vi.clearAllMocks();
    });
    it("200: обновляет btradeStock", async () => {
        const updatedArt = { artikul: "ART-001", btradeStock: { value: 5 } };
        vi.spyOn(updateUtil, "updateBtradeStockUtil").mockResolvedValue(updatedArt);
        const req = { params: { artikul: "ART-001" } };
        await updateBtradeStockController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("BtradeStock updated successfully");
        expect(responseJson.data).toEqual(updatedArt);
    });
    it("404: артикул не найден или нет данных на sharik.ua", async () => {
        vi.spyOn(updateUtil, "updateBtradeStockUtil").mockResolvedValue(null);
        const req = { params: { artikul: "MISSING" } };
        await updateBtradeStockController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Art not found or product not found on sharik.ua");
    });
    it("400: ошибка валидации при пустом artikul", async () => {
        const req = { params: { artikul: "" } };
        await updateBtradeStockController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("500: обрабатывает ошибки util", async () => {
        vi.spyOn(updateUtil, "updateBtradeStockUtil").mockRejectedValue(new Error("Server failure"));
        const req = { params: { artikul: "ART-ERR" } };
        await updateBtradeStockController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
    it("200: создаёт audit event когда req.user присутствует", async () => {
        const user = await createTestUser({ username: `btrade-stock-event-${Date.now()}` });
        const updatedArt = {
            _id: new mongoose.Types.ObjectId(),
            artikul: "ART-001",
            btradeStock: { value: 5 },
        };
        vi.spyOn(updateUtil, "updateBtradeStockUtil").mockResolvedValue(updatedArt);
        const req = {
            params: { artikul: "ART-001" },
            user: { id: user._id.toString(), role: "ADMIN" },
        };
        await updateBtradeStockController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "arts" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
