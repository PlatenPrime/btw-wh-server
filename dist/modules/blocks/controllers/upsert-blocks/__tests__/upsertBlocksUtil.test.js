import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
import { upsertBlocksUtil } from "../utils/upsertBlocksUtil.js";
describe("upsertBlocksUtil", () => {
    it("creates new blocks when _id is not provided", async () => {
        const result = await upsertBlocksUtil({
            blocks: [
                {
                    title: "Block A",
                    order: 1,
                },
                {
                    title: "Block B",
                    order: 2,
                },
            ],
        });
        expect(result.bulkResult.upsertedCount).toBe(2);
        const blocks = await Block.find({}).sort({ order: 1 }).lean().exec();
        expect(blocks).toHaveLength(2);
        expect(blocks[0].title).toBe("Block A");
        expect(blocks[1].title).toBe("Block B");
    });
    it("updates existing block and syncs blockData titles in segments", async () => {
        const block = await Block.create({
            title: "Legacy Block",
            order: 1,
            segs: [],
        });
        await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: "Legacy Block" },
            order: 1,
            sector: 1001,
            zones: [],
        });
        await upsertBlocksUtil({
            blocks: [
                {
                    _id: block._id.toString(),
                    title: "Updated Block",
                    order: 5,
                },
            ],
        });
        const updatedBlock = await Block.findById(block._id).lean().exec();
        expect(updatedBlock?.title).toBe("Updated Block");
        expect(updatedBlock?.order).toBe(5);
        const updatedSeg = await Seg.findOne({ block: block._id }).lean().exec();
        expect(updatedSeg?.blockData.title).toBe("Updated Block");
    });
    it("throws when seg ids do not belong to the block", async () => {
        const blockA = await Block.create({ title: "A", order: 1, segs: [] });
        const blockB = await Block.create({ title: "B", order: 2, segs: [] });
        const seg = await Seg.create({
            block: blockA._id,
            blockData: { _id: blockA._id, title: "A" },
            order: 1,
            sector: 1001,
            zones: [],
        });
        await expect(upsertBlocksUtil({
            blocks: [
                {
                    _id: blockB._id.toString(),
                    title: "B",
                    order: 2,
                    segs: [seg._id.toString()],
                },
            ],
        })).rejects.toThrow(/do not belong to block/i);
    });
    it("throws when payload contains duplicate block titles", async () => {
        await expect(upsertBlocksUtil({
            blocks: [
                { title: "Dup", order: 1 },
                { title: "dup", order: 2 },
            ],
        })).rejects.toThrow(/duplicate block title/i);
    });
    it("throws when payload contains duplicate block ids", async () => {
        const blockId = new mongoose.Types.ObjectId().toString();
        await expect(upsertBlocksUtil({
            blocks: [
                { _id: blockId, title: "One", order: 1 },
                { _id: blockId, title: "Two", order: 2 },
            ],
        })).rejects.toThrow(/duplicate block _id/i);
    });
});
