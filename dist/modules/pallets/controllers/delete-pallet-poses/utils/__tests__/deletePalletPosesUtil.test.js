import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos } from "../../../../../../test/utils/testHelpers.js";
import { Pallet } from "../../../../models/Pallet.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { deletePalletPosesUtil } from "../deletePalletPosesUtil.js";
describe("deletePalletPosesUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("удаляет все poses паллеты и очищает массив poses", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const pallet = await createTestPallet({ title: "Pallet-1" });
            const pos1 = await createTestPos({
                pallet: pallet._id,
                palletData: {
                    _id: pallet._id,
                    title: pallet.title,
                    sector: pallet.sector,
                    isDef: pallet.isDef,
                },
                palletTitle: pallet.title,
            });
            const pos2 = await createTestPos({
                pallet: pallet._id,
                palletData: {
                    _id: pallet._id,
                    title: pallet.title,
                    sector: pallet.sector,
                    isDef: pallet.isDef,
                },
                palletTitle: pallet.title,
            });
            pallet.poses = [pos1._id, pos2._id];
            await pallet.save({ session });
            await deletePalletPosesUtil({
                palletId: String(pallet._id),
                session,
            });
            const deletedPos1 = await Pos.findById(pos1._id).session(session);
            const deletedPos2 = await Pos.findById(pos2._id).session(session);
            expect(deletedPos1).toBeNull();
            expect(deletedPos2).toBeNull();
            const updatedPallet = await Pallet.findById(pallet._id).session(session);
            expect(updatedPallet?.poses).toEqual([]);
        });
        await session.endSession();
    });
    it("выбрасывает ошибку если паллета не найдена", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            await expect(deletePalletPosesUtil({
                palletId: new mongoose.Types.ObjectId().toString(),
                session,
            })).rejects.toThrow("Pallet not found");
        });
        await session.endSession();
    });
});
