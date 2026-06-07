import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { reorderPalletGroupsController } from "../reorderPalletGroupsController.js";
describe("reorderPalletGroupsController", () => {
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
    it("200: reorders groups successfully", async () => {
        const g1 = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [],
        });
        const g2 = await PalletGroup.create({
            title: "Group B",
            order: 2,
            pallets: [],
        });
        const req = {
            body: {
                orders: [
                    { id: g1._id.toString(), order: 2 },
                    { id: g2._id.toString(), order: 1 },
                ],
            },
        };
        await reorderPalletGroupsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallet groups order updated successfully");
        expect(responseJson.data.updatedCount).toBe(2);
    });
    it("400: validation error when orders is missing", async () => {
        const req = { body: {} };
        await reorderPalletGroupsController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid data");
    });
});
