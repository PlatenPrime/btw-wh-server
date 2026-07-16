import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { unlinkPalletController } from "../unlinkPalletController.js";
describe("unlinkPalletController", () => {
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
    it("200: unlinks pallet from group", async () => {
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
            body: { palletId: pallet._id.toString() },
        };
        await unlinkPalletController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallet unlinked from group successfully");
        const data = responseJson.data;
        expect(data.pallets).toHaveLength(0);
        const updatedGroup = await PalletGroup.findById(group._id).lean();
        expect(updatedGroup?.pallets).toHaveLength(0);
    });
    it("200: creates audit event when req.user is present", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const pallet = await Pallet.create({
            title: "P-Event",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 101,
        });
        const group = await PalletGroup.create({
            title: "Group Event",
            order: 1,
            pallets: [pallet._id],
        });
        const user = await createTestUser({
            username: `unlink-pallet-event-${Date.now()}`,
        });
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
            body: { palletId: pallet._id.toString() },
        };
        await unlinkPalletController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "pallet-groups" });
        expect(events).toHaveLength(1);
        expect(events[0].description).toContain("Group Event");
    });
    it("404: pallet is not linked to any group", async () => {
        const rowId = new mongoose.Types.ObjectId();
        const pallet = await Pallet.create({
            title: "P1",
            row: rowId,
            rowData: { _id: rowId, title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 0,
        });
        const req = {
            body: { palletId: pallet._id.toString() },
        };
        await unlinkPalletController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet is not linked to any group");
    });
    it("400: validation error for invalid pallet id", async () => {
        const req = { body: { palletId: "bad-id" } };
        await unlinkPalletController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid data");
    });
});
