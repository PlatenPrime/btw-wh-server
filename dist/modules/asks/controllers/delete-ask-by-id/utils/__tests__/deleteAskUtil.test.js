import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { createTestAsk } from "../../../../../../test/setup.js";
import { Ask } from "../../../../models/Ask.js";
import { deleteAskUtil } from "../deleteAskUtil.js";
describe("deleteAskUtil", () => {
    it("удаляет существующую заявку и возвращает её данные", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const ask = await createTestAsk({ artikul: "ART-DEL" });
            const removed = await deleteAskUtil({ id: String(ask._id), session });
            expect(removed).not.toBeNull();
            expect(removed?.artikul).toBe("ART-DEL");
            const still = await Ask.findById(ask._id).session(session);
            expect(still).toBeNull();
        });
        await session.endSession();
    });
    it("возвращает null для несуществующего id", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const res = await deleteAskUtil({
                id: new mongoose.Types.ObjectId().toString(),
                session,
            });
            expect(res).toBeNull();
        });
        await session.endSession();
    });
});
