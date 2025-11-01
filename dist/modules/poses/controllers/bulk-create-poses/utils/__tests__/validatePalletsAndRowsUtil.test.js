import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestRow, } from "../../../../../../test/utils/testHelpers.js";
import { validatePalletsAndRowsUtil } from "../validatePalletsAndRowsUtil.js";
describe("validatePalletsAndRowsUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает паллеты и ряды если все найдены", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const row1 = await createTestRow();
            const row2 = await createTestRow();
            const pallet1 = await createTestPallet({
                row: { _id: row1._id, title: row1.title },
            });
            const pallet2 = await createTestPallet({
                row: { _id: row2._id, title: row2.title },
            });
            const result = await validatePalletsAndRowsUtil({
                poses: [
                    {
                        palletId: pallet1._id.toString(),
                        rowId: row1._id.toString(),
                        artikul: "ART-1",
                        quant: 10,
                        boxes: 2,
                    },
                    {
                        palletId: pallet2._id.toString(),
                        rowId: row2._id.toString(),
                        artikul: "ART-2",
                        quant: 20,
                        boxes: 4,
                    },
                ],
                session,
            });
            expect(result.pallets.length).toBe(2);
            expect(result.rows.length).toBe(2);
        });
        await session.endSession();
    });
    it("выбрасывает ошибку если какие-то паллеты не найдены", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const row = await createTestRow();
            const pallet = await createTestPallet({
                row: { _id: row._id, title: row.title },
            });
            const nonExistentPalletId = new mongoose.Types.ObjectId().toString();
            await expect(validatePalletsAndRowsUtil({
                poses: [
                    {
                        palletId: pallet._id.toString(),
                        rowId: row._id.toString(),
                        artikul: "ART-1",
                        quant: 10,
                        boxes: 2,
                    },
                    {
                        palletId: nonExistentPalletId,
                        rowId: row._id.toString(),
                        artikul: "ART-2",
                        quant: 20,
                        boxes: 4,
                    },
                ],
                session,
            })).rejects.toThrow("Some pallets not found");
        });
        await session.endSession();
    });
    it("выбрасывает ошибку если какие-то ряды не найдены", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const row = await createTestRow();
            const pallet = await createTestPallet({
                row: { _id: row._id, title: row.title },
            });
            const nonExistentRowId = new mongoose.Types.ObjectId().toString();
            await expect(validatePalletsAndRowsUtil({
                poses: [
                    {
                        palletId: pallet._id.toString(),
                        rowId: row._id.toString(),
                        artikul: "ART-1",
                        quant: 10,
                        boxes: 2,
                    },
                    {
                        palletId: pallet._id.toString(),
                        rowId: nonExistentRowId,
                        artikul: "ART-2",
                        quant: 20,
                        boxes: 4,
                    },
                ],
                session,
            })).rejects.toThrow("Some rows not found");
        });
        await session.endSession();
    });
});
