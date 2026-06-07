import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { upsertBlocksController } from "../upsertBlocksController.js";
describe("upsertBlocksController", () => {
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
    it("200: upserts blocks successfully", async () => {
        const req = {
            body: [
                { title: "Block A", order: 1 },
                { title: "Block B", order: 2 },
            ],
        };
        await upsertBlocksController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Blocks upsert completed");
        expect(responseJson.data.updatedBlocks).toHaveLength(2);
        const blocks = await Block.find({}).sort({ order: 1 }).lean().exec();
        expect(blocks[0].title).toBe("Block A");
        expect(blocks[1].title).toBe("Block B");
    });
    it("400: validation error for invalid payload", async () => {
        const req = {
            body: [{ title: "", order: 0 }],
        };
        await upsertBlocksController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(Array.isArray(responseJson.errors)).toBe(true);
    });
    it("500: server error on duplicate titles in payload", async () => {
        const req = {
            body: [
                { title: "Dup", order: 1 },
                { title: "dup", order: 2 },
            ],
        };
        await upsertBlocksController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
});
