import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Block } from "../../../../../blocks/models/Block.js";
import { Zone } from "../../../../../zones/models/Zone.js";
import { Seg } from "../../../../models/Seg.js";
import { deleteSegUtil } from "../deleteSegUtil.js";
describe("deleteSegUtil", () => {
    const createZone = async () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 99) + 1;
        return Zone.create({
            title: `42-${(timestamp % 99) + 1}-${random}`,
            bar: Math.max(1, Math.floor(Math.random() * 1_000_000)),
            sector: 0,
        });
    };
    const runWithSession = async (fn) => {
        const session = await mongoose.startSession();
        try {
            let result;
            await session.withTransaction(async () => {
                result = await fn(session);
            });
            return result;
        }
        finally {
            await session.endSession();
        }
    };
    it("deletes segment, clears zone refs and removes from block.segs", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
        const zone = await createZone();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [{ _id: zone._id, title: zone.title }],
        });
        block.segs.push(seg._id);
        await block.save();
        await Zone.updateOne({ _id: zone._id }, { $set: { "seg.id": seg._id, sector: seg.sector } });
        const deleted = await runWithSession((session) => deleteSegUtil({ segId: seg._id.toString(), session }));
        expect(deleted).not.toBeNull();
        expect(deleted?._id.toString()).toBe(seg._id.toString());
        const foundSeg = await Seg.findById(seg._id).exec();
        expect(foundSeg).toBeNull();
        const updatedZone = await Zone.findById(zone._id).lean().exec();
        expect(updatedZone?.seg).toBeUndefined();
        expect(updatedZone?.sector).toBe(0);
        const updatedBlock = await Block.findById(block._id).lean().exec();
        expect(updatedBlock?.segs).toHaveLength(0);
    });
    it("returns null when segment not found", async () => {
        const missingId = new mongoose.Types.ObjectId().toString();
        const result = await runWithSession((session) => deleteSegUtil({ segId: missingId, session }));
        expect(result).toBeNull();
    });
    it("deletes segment without zones", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-nz`, order: 1, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        block.segs.push(seg._id);
        await block.save();
        const deleted = await runWithSession((session) => deleteSegUtil({ segId: seg._id.toString(), session }));
        expect(deleted).not.toBeNull();
        expect(await Seg.findById(seg._id).exec()).toBeNull();
    });
});
