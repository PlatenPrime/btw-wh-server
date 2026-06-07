import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Pallet } from "../../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../../models/PalletGroup.js";
import { unlinkPalletUtil } from "../unlinkPalletUtil.js";
describe("unlinkPalletUtil", () => {
    beforeEach(async () => {
        await Pallet.deleteMany({});
        await PalletGroup.deleteMany({});
    });
    it("removes pallet from group and resets sector", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const pallet = await Pallet.create({
            title: "P1",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 101,
            palgr: { id: new mongoose.Types.ObjectId(), title: "Group" },
        });
        const group = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [pallet._id],
        });
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const result = await unlinkPalletUtil({
                palletId: pallet._id.toString(),
                session,
            });
            await session.commitTransaction();
            expect(result).not.toBeNull();
            expect(result.pallets).toHaveLength(0);
        }
        finally {
            session.endSession();
        }
        const updatedPallet = await Pallet.findById(pallet._id).lean();
        expect(updatedPallet?.sector).toBe(0);
        expect(updatedPallet?.palgr).toBeUndefined();
        const updatedGroup = await PalletGroup.findById(group._id).lean();
        expect(updatedGroup?.pallets).toHaveLength(0);
    });
    it("returns null when pallet is not in any group", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const pallet = await Pallet.create({
            title: "P1",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 0,
        });
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const result = await unlinkPalletUtil({
                palletId: pallet._id.toString(),
                session,
            });
            await session.commitTransaction();
            expect(result).toBeNull();
        }
        finally {
            session.endSession();
        }
    });
});
