import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { getAllPalletGroupsController } from "../getAllPalletGroupsController.js";
describe("getAllPalletGroupsController", () => {
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
    it("200: returns all groups sorted by order", async () => {
        await PalletGroup.create({ title: "Group B", order: 2, pallets: [] });
        await PalletGroup.create({ title: "Group A", order: 1, pallets: [] });
        const req = {};
        await getAllPalletGroupsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallet groups fetched successfully");
        const data = responseJson.data;
        expect(data).toHaveLength(2);
        expect(data[0].title).toBe("Group A");
        expect(data[1].title).toBe("Group B");
    });
    it("200: returns empty array when no groups exist", async () => {
        const req = {};
        await getAllPalletGroupsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toEqual([]);
    });
});
