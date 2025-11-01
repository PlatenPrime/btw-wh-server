import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos, createTestRow, } from "../../../../../../test/utils/testHelpers.js";
import { Pos } from "../../../../models/Pos.js";
import { deletePosUtil } from "../deletePosUtil.js";
describe("deletePosUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("удаляет позицию в транзакции и возвращает удалённый документ", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const row = await createTestRow();
            const pallet = await createTestPallet({
                row: { _id: row._id, title: row.title },
            });
            const pos = await createTestPos({
                pallet: { _id: pallet._id, title: pallet.title },
                row: { _id: row._id, title: row.title },
                artikul: "ART-DELETE",
            });
            const result = await deletePosUtil({
                posId: pos._id.toString(),
                session,
            });
            expect(result).toBeTruthy();
            expect(result._id.toString()).toBe(pos._id.toString());
            expect(result.artikul).toBe("ART-DELETE");
            const found = await Pos.findById(pos._id).session(session);
            expect(found).toBeNull();
        });
        await session.endSession();
    });
    it("выбрасывает ошибку если позиция не найдена", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            await expect(deletePosUtil({
                posId: nonExistentId,
                session,
            })).rejects.toThrow("Position not found");
        });
        await session.endSession();
    });
});
