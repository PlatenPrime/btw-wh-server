import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { createTestPos } from "../../../../test/setup.js";
import { getEmptyPalletsController } from "../get-empty-pallets/getEmptyPalletsController.js";
describe("getEmptyPalletsController", () => {
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
    it("200: возвращает только пустые паллеты", async () => {
        const emptyPallet1 = await createTestPallet({ title: "Empty-1", poses: [] });
        const emptyPallet2 = await createTestPallet({ title: "Empty-2", poses: [] });
        const filledPallet = await createTestPallet({ title: "Filled-1", poses: [] });
        const pos = await createTestPos({ pallet: filledPallet });
        filledPallet.poses = [pos._id];
        await filledPallet.save();
        const req = {};
        await getEmptyPalletsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        const titles = responseJson.map((p) => p.title);
        expect(titles).toContain("Empty-1");
        expect(titles).toContain("Empty-2");
        expect(titles).not.toContain("Filled-1");
    });
});
