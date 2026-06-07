import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Pallet } from "../../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../../models/PalletGroup.js";
import { getFreePalletsUtil } from "../getFreePalletsUtil.js";
const createPallet = async (title) => {
    const rowId = new mongoose.Types.ObjectId();
    return Pallet.create({
        title,
        row: rowId,
        rowData: { _id: rowId, title: "Row 1" },
        poses: [],
        isDef: false,
        sector: 0,
    });
};
describe("getFreePalletsUtil", () => {
    beforeEach(async () => {
        await Pallet.deleteMany({});
        await PalletGroup.deleteMany({});
    });
    it("returns pallets not assigned to any group", async () => {
        const palletP1 = await createPallet("P1");
        await createPallet("P2");
        await PalletGroup.create({
            title: "Group 1",
            order: 1,
            pallets: [palletP1._id],
        });
        const result = await getFreePalletsUtil();
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("P2");
    });
    it("returns empty array when all pallets are in groups", async () => {
        const pallet = await createPallet("P1");
        await PalletGroup.create({
            title: "Group 1",
            order: 1,
            pallets: [pallet._id],
        });
        const result = await getFreePalletsUtil();
        expect(result).toEqual([]);
    });
});
