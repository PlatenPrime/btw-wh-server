import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
import { updateBlock } from "../updateBlock.js";
describe("updateBlockController", () => {
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
    it("200: updates block successfully", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const req = {
            params: { id: block._id.toString() },
            body: { title: "Updated Block", order: 3 },
        };
        await updateBlock(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Block updated successfully");
        expect(responseJson.data.title).toBe("Updated Block");
        expect(responseJson.data.order).toBe(3);
    });
    it("400: invalid block ID format", async () => {
        const req = {
            params: { id: "invalid-id" },
            body: { title: "Updated" },
        };
        await updateBlock(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid block ID format");
    });
    it("400: validation error for invalid order", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const req = {
            params: { id: block._id.toString() },
            body: { order: 0 },
        };
        await updateBlock(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404: block not found", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { title: "Updated" },
        };
        await updateBlock(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Block not found");
    });
    it("409: duplicate title", async () => {
        await Block.create({ title: "Block A", order: 1, segs: [] });
        const blockB = await Block.create({ title: "Block B", order: 2, segs: [] });
        const req = {
            params: { id: blockB._id.toString() },
            body: { title: "Block A" },
        };
        await updateBlock(req, res);
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Block with this title already exists");
    });
    it("200: updates segs array", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        const req = {
            params: { id: block._id.toString() },
            body: { segs: [seg._id.toString()] },
        };
        await updateBlock(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.segs).toHaveLength(1);
    });
});
