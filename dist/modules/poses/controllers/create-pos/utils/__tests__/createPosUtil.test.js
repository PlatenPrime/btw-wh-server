import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestRow, } from "../../../../../../test/utils/testHelpers.js";
import { Pos } from "../../../../models/Pos.js";
import { createPosUtil } from "../createPosUtil.js";
describe("createPosUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("создаёт позицию в транзакции и возвращает сохранённый документ", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const row = await createTestRow({ title: "Row 1" });
            const pallet = await createTestPallet({
                row: { _id: row._id, title: row.title },
                title: "Pallet 1",
            });
            const result = await createPosUtil({
                pallet,
                row,
                artikul: "ART-001",
                nameukr: "Папір А4",
                quant: 10,
                boxes: 2,
                date: "04.21",
                sklad: "merezhi",
                comment: "Test comment",
                session,
            });
            expect(result).toBeTruthy();
            expect(result._id).toBeDefined();
            expect(result.artikul).toBe("ART-001");
            expect(result.quant).toBe(10);
            expect(result.boxes).toBe(2);
            expect(result.palletData._id.toString()).toBe(pallet._id.toString());
            expect(result.rowData._id.toString()).toBe(row._id.toString());
            const found = await Pos.findById(result._id).session(session);
            expect(found).not.toBeNull();
        });
        await session.endSession();
    });
});
