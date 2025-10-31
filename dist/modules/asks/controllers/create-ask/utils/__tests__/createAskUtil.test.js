import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { Ask } from "../../../../models/Ask.js";
import { createAskUtil } from "../createAskUtil.js";
describe("createAskUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("создаёт Ask в транзакции и возвращает сохранённый документ", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const asker = await createTestUser({ fullname: "Creator One" });
            const result = await createAskUtil({
                artikul: "ART-001",
                nameukr: "Папір А4",
                quant: 3,
                com: "терміново",
                askerData: asker,
                actions: ["2025-01-01 12:00 Creator One: створив запит"],
                session,
            });
            expect(result).toBeTruthy();
            expect(result._id).toBeDefined();
            expect(result.artikul).toBe("ART-001");
            expect(result.status).toBe("new");
            expect(Array.isArray(result.actions)).toBe(true);
            expect(result.actions.length).toBe(1);
            const found = await Ask.findById(result._id).session(session);
            expect(found).not.toBeNull();
            expect(found?.asker.toString()).toBe(String(asker._id));
        });
        await session.endSession();
    });
});
