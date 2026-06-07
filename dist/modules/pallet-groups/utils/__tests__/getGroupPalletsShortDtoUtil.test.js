import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../models/PalletGroup.js";
import { getPalletsShortForGroup, getPalletsShortForGroups, } from "../getGroupPalletsShortDtoUtil.js";
describe("getGroupPalletsShortDtoUtil", () => {
    beforeEach(async () => {
        await Pallet.deleteMany({});
        await PalletGroup.deleteMany({});
    });
    it("getPalletsShortForGroup returns empty array for group without pallets", async () => {
        const group = await PalletGroup.create({
            title: "Empty Group",
            order: 1,
            pallets: [],
        });
        const result = await getPalletsShortForGroup(group);
        expect(result).toEqual([]);
    });
    it("getPalletsShortForGroup preserves pallet order from group", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const palletP1 = await Pallet.create({
            title: "P1",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 101,
        });
        const palletP2 = await Pallet.create({
            title: "P2",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: true,
            sector: 102,
        });
        const group = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [palletP2._id, palletP1._id],
        });
        const result = await getPalletsShortForGroup(group);
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("P2");
        expect(result[1].title).toBe("P1");
        expect(result[0].isDef).toBe(true);
        expect(result[1].sector).toBe(101);
    });
    it("getPalletsShortForGroups returns map keyed by group id", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const pallet = await Pallet.create({
            title: "P1",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 0,
        });
        const group1 = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [pallet._id],
        });
        const group2 = await PalletGroup.create({
            title: "Group B",
            order: 2,
            pallets: [],
        });
        const result = await getPalletsShortForGroups([group1, group2]);
        expect(Object.keys(result)).toHaveLength(2);
        expect(result[group1._id.toString()]).toHaveLength(1);
        expect(result[group1._id.toString()][0].title).toBe("P1");
        expect(result[group2._id.toString()]).toEqual([]);
    });
});
