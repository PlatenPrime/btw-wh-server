import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../../utils/getCurrentFormattedDateTime.js", () => ({
    getCurrentFormattedDateTime: () => "2025-01-01 12:00",
}));
import { pullAskById } from "../pull-ask-by-id/pullAskById.js";
import { createTestAsk, createTestUser, } from "../../../../test/setup.js";
describe("pullAskById controller", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
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
        };
    });
    it("200: записывает pull событие и обновляет агрегаты", async () => {
        const solver = await createTestUser({
            fullname: "Solver User",
            username: `solver-${Date.now()}`,
        });
        const ask = await createTestAsk();
        const req = {
            params: { id: String(ask._id) },
            body: {
                solverId: String(solver._id),
                action: "Сняли 5 штук",
                pullAskData: {
                    palletData: {
                        _id: new mongoose.Types.ObjectId().toString(),
                        title: "Pallet-123",
                    },
                    quant: 5,
                    boxes: 2,
                },
            },
        };
        await pullAskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.pullQuant).toBe(5);
        expect(responseJson.pullBox).toBe(2);
        expect(responseJson.events).toHaveLength(1);
        expect(responseJson.events[0].eventName).toBe("pull");
        expect(responseJson.events[0].pullDetails.quant).toBe(5);
    });
    it("400: возвращает ошибку валидации", async () => {
        const req = {
            params: { id: "invalid" },
            body: {
                solverId: "invalid",
                action: "",
                pull: {
                    palletData: { _id: "invalid", title: "" },
                    quant: 0,
                    boxes: 0,
                },
            },
        };
        await pullAskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404: ask не найден", async () => {
        const solver = await createTestUser();
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: {
                solverId: String(solver._id),
                action: "Сняли вещь",
                pullAskData: {
                    palletData: {
                        _id: new mongoose.Types.ObjectId().toString(),
                        title: "Pallet",
                    },
                    quant: 1,
                    boxes: 0,
                },
            },
        };
        await pullAskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Ask not found");
    });
    it("404: solver не найден", async () => {
        const ask = await createTestAsk();
        const req = {
            params: { id: String(ask._id) },
            body: {
                solverId: new mongoose.Types.ObjectId().toString(),
                action: "Сняли вещь",
                pullAskData: {
                    palletData: {
                        _id: new mongoose.Types.ObjectId().toString(),
                        title: "Pallet",
                    },
                    quant: 1,
                    boxes: 0,
                },
            },
        };
        await pullAskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Solver user not found");
    });
});
