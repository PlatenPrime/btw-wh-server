import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";
vi.mock("../getUpdateAskActionUtil.js", () => ({
    getUpdateAskActionUtil: () => "2025-01-01 12:00 Solver: додав дію",
}));
import { updateAskUtil } from "../updateAskUtil.js";
import { createTestAsk, createTestUser } from "../../../../../../test/setup.js";
describe("updateAskUtil", () => {
    it("обновляет заявку: добавляет действие, при передаче status меняет статус", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const ask = await createTestAsk({ actions: [], status: "new" });
            const solver = await createTestUser({ fullname: "Solver" });
            const updated = await updateAskUtil({
                solver,
                solverId: solver._id,
                ask,
                action: "додав дію",
                status: "completed",
                session,
            });
            expect(updated.status).toBe("completed");
            expect(updated.solverData?.fullname).toBe("Solver");
            expect(updated.actions.at(-1)).toContain("додав дію");
        });
        await session.endSession();
    });
});
