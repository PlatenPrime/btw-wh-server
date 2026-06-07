import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { getPalletGroupByIdController } from "../getPalletGroupByIdController.js";
describe("getPalletGroupByIdController", () => {
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
    it("200: returns group with pallet short DTOs", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const pallet = await Pallet.create({
            title: "P1",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 101,
        });
        const group = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [pallet._id],
        });
        const req = {
            params: { id: group._id.toString() },
        };
        await getPalletGroupByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallet group fetched successfully");
        const data = responseJson.data;
        expect(data.title).toBe("Group A");
        expect(data.pallets).toHaveLength(1);
        expect(data.pallets[0].title).toBe("P1");
        expect(data.pallets[0].id).toBe(pallet._id.toString());
    });
    it("400: invalid id format", async () => {
        const req = { params: { id: "bad-id" } };
        await getPalletGroupByIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid pallet group id");
    });
    it("404: group not found", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await getPalletGroupByIdController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet group not found");
    });
});
