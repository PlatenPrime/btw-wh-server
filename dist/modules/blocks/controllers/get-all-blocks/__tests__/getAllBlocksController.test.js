import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { getAllBlocks } from "../getAllBlocks.js";
describe("getAllBlocksController", () => {
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
    it("200: returns all blocks with exists=true", async () => {
        await Block.create({ title: "Block A", order: 1, segs: [] });
        await Block.create({ title: "Block B", order: 2, segs: [] });
        const req = {};
        await getAllBlocks(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Blocks retrieved successfully");
        expect(responseJson.data).toHaveLength(2);
    });
    it("200: returns empty list with exists=false", async () => {
        const req = {};
        await getAllBlocks(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.data).toEqual([]);
    });
});
