import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos, } from "../../../../../../test/utils/testHelpers.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { updatePosesPalletDataUtil } from "../updatePosesPalletDataUtil.js";
describe("updatePosesPalletDataUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("обновляет palletData в связанных poses", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const pallet = await createTestPallet({
                title: "Pallet-1",
                sector: 1,
                isDef: false,
            });
            const pos1 = await createTestPos({
                pallet: pallet._id,
                palletData: {
                    _id: pallet._id,
                    title: pallet.title,
                    sector: pallet.sector,
                    isDef: pallet.isDef,
                },
                palletTitle: pallet.title,
                artikul: "ART-1",
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
                artikul: "ART-2",
            });
            await updatePosesPalletDataUtil({
                palletId: String(pallet._id),
                title: "Updated-Pallet",
                sector: 2,
                isDef: true,
                session,
            });
            const updatedPos1 = await Pos.findById(pos1._id).session(session);
            const updatedPos2 = await Pos.findById(pos2._id).session(session);
            expect(updatedPos1?.palletData.title).toBe("Updated-Pallet");
            expect(updatedPos1?.palletData.sector).toBe(2);
            expect(updatedPos1?.palletData.isDef).toBe(true);
            expect(updatedPos1?.palletTitle).toBe("Updated-Pallet");
            expect(updatedPos2?.palletData.title).toBe("Updated-Pallet");
            expect(updatedPos2?.palletData.sector).toBe(2);
            expect(updatedPos2?.palletData.isDef).toBe(true);
        });
        await session.endSession();
    });
    it("обновляет только title если указан только он", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const pallet = await createTestPallet({
                title: "Pallet-1",
                sector: 1,
            });
            const pos = await createTestPos({
                pallet: pallet._id,
                palletData: {
                    _id: pallet._id,
                    title: pallet.title,
                    sector: pallet.sector,
                    isDef: pallet.isDef,
                },
                palletTitle: pallet.title,
            });
            await updatePosesPalletDataUtil({
                palletId: String(pallet._id),
                title: "New-Title",
                session,
            });
            const updatedPos = await Pos.findById(pos._id).session(session);
            expect(updatedPos?.palletData.title).toBe("New-Title");
            expect(updatedPos?.palletTitle).toBe("New-Title");
        });
        await session.endSession();
    });
});
