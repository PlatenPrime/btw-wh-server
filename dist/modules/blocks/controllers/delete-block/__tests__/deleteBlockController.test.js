import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
import { deleteBlock } from "../deleteBlock.js";
describe("deleteBlockController", () => {
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
    it("200: deletes block successfully", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const req = {
            params: { id: block._id.toString() },
        };
        await deleteBlock(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Block deleted successfully");
        expect(responseJson.data.title).toBe("Block A");
        const deleted = await Block.findById(block._id);
        expect(deleted).toBeNull();
    });
    it("404: block not found", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await deleteBlock(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Block not found");
    });
    it("400: invalid block ID format", async () => {
        const req = { params: { id: "invalid-id" } };
        await deleteBlock(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid block ID format");
    });
    it("200: deletes block with segments", async () => {
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
        };
        await deleteBlock(req, res);
        expect(responseStatus.code).toBe(200);
        const deletedSeg = await Seg.findById(seg._id);
        expect(deletedSeg).toBeNull();
    });
});
