import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";
vi.mock("../getUpdateAskActionUtil.js", () => ({
    getUpdateAskActionUtil: () => "2025-01-01 12:00 User: додав дію",
}));
import { updateAskActionsUtil } from "../updateAskActionsUtil.js";
import { createTestAsk, createTestUser } from "../../../../../../test/setup.js";
describe("updateAskActionsUtil", () => {
    it("добавляет новое действие в заявку", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const ask = await createTestAsk({ actions: [] });
            const user = await createTestUser({ fullname: "User" });
            const updated = await updateAskActionsUtil({
                user,
                ask,
                action: "додав дію",
                session,
            });
            expect(updated.actions.length).toBe(1);
            expect(updated.actions[0]).toContain("додав дію");
        });
        await session.endSession();
    });
});
