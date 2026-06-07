import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { recalculatePalletsSectorsController } from "../recalculatePalletsSectorsController.js";
describe("recalculatePalletsSectorsController", () => {
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
    it("200: recalculates pallet sectors", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const pallet = await Pallet.create({
            title: "P1",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 0,
        });
        await PalletGroup.create({
            title: "Group 1",
            order: 1,
            pallets: [pallet._id],
        });
        const req = {};
        await recalculatePalletsSectorsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallets sectors recalculated successfully");
        const data = responseJson.data;
        expect(data.groupsProcessed).toBe(1);
        expect(data.updatedPallets).toBeGreaterThanOrEqual(1);
        const updated = await Pallet.findById(pallet._id).lean();
        expect(updated?.sector).toBe(101);
    });
});
