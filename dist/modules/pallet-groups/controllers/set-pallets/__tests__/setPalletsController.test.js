import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { setPalletsController } from "../setPalletsController.js";
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
describe("setPalletsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
        };
    });
    it("200: sets pallets for group and recalculates sectors", async () => {
        const pallet = await createPallet("P1");
        const group = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [],
        });
        const req = {
            body: {
                groupId: group._id.toString(),
                palletIds: [pallet._id.toString()],
            },
        };
        await setPalletsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallets set for group successfully");
        const data = responseJson.data;
        expect(data.pallets).toHaveLength(1);
        expect(data.pallets[0].title).toBe("P1");
        expect(data.pallets[0].sector).toBe(101);
    });
    it("400: validation error when palletIds is empty", async () => {
        const group = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [],
        });
        const req = {
            body: { groupId: group._id.toString(), palletIds: [] },
        };
        await setPalletsController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid data");
    });
});
