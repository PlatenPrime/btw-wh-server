import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos, createTestRow, } from "../../../../../../test/utils/testHelpers.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { Pallet } from "../../../../models/Pallet.js";
import { movePalletPosesUtil } from "../movePalletPosesUtil.js";
describe("movePalletPosesUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("перемещает poses из source в target паллету", async () => {
        const row1 = await createTestRow({ title: "Row 1" });
        const row2 = await createTestRow({ title: "Row 2" });
        const sourcePallet = await createTestPallet({
            row: row1._id,
            rowData: { _id: row1._id, title: row1.title },
            title: "Source-Pallet",
        });
        const targetPallet = await createTestPallet({
            row: row2._id,
            rowData: { _id: row2._id, title: row2.title },
            title: "Target-Pallet",
            poses: [],
        });
        const pos1 = await createTestPos({
            pallet: sourcePallet._id,
            row: row1._id,
            palletData: {
                _id: sourcePallet._id,
                title: sourcePallet.title,
                sector: sourcePallet.sector,
                isDef: sourcePallet.isDef,
            },
            rowData: {
                _id: row1._id,
                title: row1.title,
            },
            palletTitle: sourcePallet.title,
            rowTitle: row1.title,
            artikul: "ART-1",
        });
        const pos2 = await createTestPos({
            pallet: sourcePallet._id,
            row: row1._id,
            palletData: {
                _id: sourcePallet._id,
                title: sourcePallet.title,
                sector: sourcePallet.sector,
                isDef: sourcePallet.isDef,
            },
            rowData: {
                _id: row1._id,
                title: row1.title,
            },
            palletTitle: sourcePallet.title,
            rowTitle: row1.title,
            artikul: "ART-2",
        });
        sourcePallet.poses = [pos1._id, pos2._id];
        await sourcePallet.save();
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const result = await movePalletPosesUtil({
                sourcePalletId: String(sourcePallet._id),
                targetPalletId: String(targetPallet._id),
                session,
            });
            expect(result.targetPallet).toBeDefined();
            expect(result.targetPallet.poses.length).toBe(2);
        });
        await session.endSession();
        // Проверяем результаты после завершения транзакции
        const updatedSourcePallet = await Pallet.findById(sourcePallet._id);
        const updatedTargetPallet = await Pallet.findById(targetPallet._id);
        expect(updatedSourcePallet?.poses.length).toBe(0);
        expect(updatedTargetPallet?.poses.length).toBe(2);
        const updatedPos1 = await Pos.findById(pos1._id);
        const updatedPos2 = await Pos.findById(pos2._id);
        expect(updatedPos1?.palletData._id.toString()).toBe(String(targetPallet._id));
        expect(updatedPos1?.palletData.title).toBe("Target-Pallet");
        expect(updatedPos1?.rowData._id.toString()).toBe(String(row2._id));
        expect(updatedPos1?.rowData.title).toBe("Row 2");
    });
    it("выбрасывает ошибку если source pallet не найдена", async () => {
        const targetPallet = await createTestPallet({ poses: [] });
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await movePalletPosesUtil({
                    sourcePalletId: new mongoose.Types.ObjectId().toString(),
                    targetPalletId: String(targetPallet._id),
                    session,
                });
                // Если дошли сюда, ошибка не была выброшена
                throw new Error("Expected error was not thrown");
            });
        }
        catch (error) {
            expect(error.message).toContain("Source pallet not found");
        }
        finally {
            await session.endSession();
        }
    });
    it("выбрасывает ошибку если target pallet не пустая", async () => {
        const row = await createTestRow({ title: "Test Row" });
        const sourcePallet = await createTestPallet({
            title: "Source",
            row: row._id,
            rowData: { _id: row._id, title: row.title },
        });
        const targetPallet = await createTestPallet({
            title: "Target",
            row: row._id,
            rowData: { _id: row._id, title: row.title },
        });
        const pos = await createTestPos({
            pallet: targetPallet._id,
            palletData: {
                _id: targetPallet._id,
                title: targetPallet.title,
                sector: targetPallet.sector,
                isDef: targetPallet.isDef,
            },
            row: row._id,
            rowData: { _id: row._id, title: row.title },
            palletTitle: targetPallet.title,
            rowTitle: row.title,
        });
        targetPallet.poses = [pos._id];
        await targetPallet.save();
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await movePalletPosesUtil({
                    sourcePalletId: String(sourcePallet._id),
                    targetPalletId: String(targetPallet._id),
                    session,
                });
                // Если дошли сюда, ошибка не была выброшена
                throw new Error("Expected error was not thrown");
            });
        }
        catch (error) {
            expect(error.message).toContain("Target pallet must be empty");
        }
        finally {
            await session.endSession();
        }
    });
});
