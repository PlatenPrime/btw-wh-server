import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { createTestPos } from "../../../../test/setup.js";
import { deletePalletEmptyPosesController } from "../delete-pallet-empty-poses/deletePalletEmptyPosesController.js";
describe("deletePalletEmptyPosesController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
        };
    });
    it("200: удаляет только пустые poses", async () => {
        const pallet = await createTestPallet({ title: "Pallet-1", poses: [] });
        const emptyPos1 = await createTestPos({
            pallet: pallet,
            quant: 0,
            boxes: 0,
        });
        const emptyPos2 = await createTestPos({
            pallet: pallet,
            quant: 0,
            boxes: 0,
        });
        const filledPos = await createTestPos({
            pallet: pallet,
            quant: 10,
            boxes: 1,
        });
        pallet.poses = [emptyPos1._id, emptyPos2._id, filledPos._id];
        await pallet.save();
        const req = {
            params: { id: String(pallet._id) },
        };
        await deletePalletEmptyPosesController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.deletedCount).toBe(2);
        expect(responseJson.affectedPoseIds.length).toBe(2);
    });
    it("200: возвращает deletedCount=0 если пустых poses нет", async () => {
        const pallet = await createTestPallet({ title: "Pallet-1", poses: [] });
        const filledPos = await createTestPos({
            pallet: pallet,
            quant: 10,
            boxes: 1,
        });
        pallet.poses = [filledPos._id];
        await pallet.save();
        const req = {
            params: { id: String(pallet._id) },
        };
        await deletePalletEmptyPosesController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.deletedCount).toBe(0);
    });
    it("404: если паллета не найдена", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await deletePalletEmptyPosesController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet not found");
    });
});
