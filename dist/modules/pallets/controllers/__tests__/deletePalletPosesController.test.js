import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPos } from "../../../../test/setup.js";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { deletePalletPosesController } from "../delete-pallet-poses/deletePalletPosesController.js";
describe("deletePalletPosesController", () => {
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
    it("200: удаляет все poses паллеты", async () => {
        const pallet = await createTestPallet({ title: "Pallet-1", poses: [] });
        const pos1 = await createTestPos({ pallet: pallet });
        const pos2 = await createTestPos({ pallet: pallet });
        pallet.poses = [pos1._id, pos2._id];
        await pallet.save();
        const req = {
            params: { id: String(pallet._id) },
        };
        await deletePalletPosesController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallet poses removed successfully");
    });
    it("404: если паллета не найдена", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await deletePalletPosesController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet not found");
    });
});
