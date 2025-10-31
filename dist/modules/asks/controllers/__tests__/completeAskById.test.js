import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../complete-ask-by-id/utils/sendCompleteAskMesUtil.js", () => ({
    sendCompleteAskMesUtil: vi.fn().mockResolvedValue(undefined),
}));
import { completeAskById } from "../complete-ask-by-id/completeAskById.js";
import { createTestAsk, createTestUser } from "../../../../test/setup.js";
describe("completeAskById", () => {
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
        };
    });
    it("200: завершает заявку", async () => {
        const asker = await createTestUser({ telegram: "123", username: `asker-${Date.now()}-${Math.random()}` });
        const ask = await createTestAsk({ asker: asker._id, askerData: { _id: asker._id, fullname: asker.fullname, telegram: asker.telegram, photo: asker.photo } });
        const solver = await createTestUser({ fullname: "Solver", username: `solver-${Date.now()}-${Math.random()}` });
        const req = {
            params: { id: String(ask._id) },
            body: { solverId: String(solver._id) },
        };
        await completeAskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.status).toBe("completed");
        expect(responseJson.solverData.fullname).toBe("Solver");
    });
    it("404: ask не найден", async () => {
        const solver = await createTestUser();
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { solverId: String(solver._id) },
        };
        await completeAskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Ask not found");
    });
    it("404: solver не найден", async () => {
        const ask = await createTestAsk();
        const req = {
            params: { id: String(ask._id) },
            body: { solverId: new mongoose.Types.ObjectId().toString() },
        };
        await completeAskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Solver user not found");
    });
    it("400: ошибка валидации", async () => {
        const req = { params: { id: "invalid" }, body: { solverId: "invalid" } };
        await completeAskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
