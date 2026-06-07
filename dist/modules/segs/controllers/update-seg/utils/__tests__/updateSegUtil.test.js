import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Block } from "../../../../../blocks/models/Block.js";
import { Zone } from "../../../../../zones/models/Zone.js";
import { Seg } from "../../../../models/Seg.js";
import { updateSegUtil } from "../updateSegUtil.js";
describe("updateSegUtil", () => {
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
    it("updates order and recalculates sector on zones", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}`, order: 3, segs: [] });
        const zone = await createZone();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 3001,
            zones: [{ _id: zone._id, title: zone.title }],
        });
        await Zone.updateOne({ _id: zone._id }, { $set: { "seg.id": seg._id, sector: seg.sector } });
        const updated = await runWithSession((session) => updateSegUtil({
            segId: seg._id.toString(),
            updateData: { order: 5 },
            session,
        }));
        expect(updated).not.toBeNull();
        expect(updated?.order).toBe(5);
        expect(updated?.sector).toBe(3005);
        const updatedZone = await Zone.findById(zone._id).lean().exec();
        expect(updatedZone?.sector).toBe(3005);
    });
    it("reassigns zones and resets removed ones", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-rz`, order: 2, segs: [] });
        const zoneOld = await createZone();
        const zoneNew = await createZone();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 2001,
            zones: [{ _id: zoneOld._id, title: zoneOld.title }],
        });
        await Zone.updateOne({ _id: zoneOld._id }, { $set: { "seg.id": seg._id, sector: seg.sector } });
        const updated = await runWithSession((session) => updateSegUtil({
            segId: seg._id.toString(),
            updateData: { zones: [zoneNew._id.toString()] },
            session,
        }));
        expect(updated?.zones).toHaveLength(1);
        expect(updated?.zones[0]._id.toString()).toBe(zoneNew._id.toString());
        const removedZone = await Zone.findById(zoneOld._id).lean().exec();
        expect(removedZone?.seg).toBeUndefined();
        expect(removedZone?.sector).toBe(0);
        const newZone = await Zone.findById(zoneNew._id).lean().exec();
        expect(newZone?.seg?.id?.toString()).toBe(seg._id.toString());
    });
    it("returns null when segment not found", async () => {
        const missingId = new mongoose.Types.ObjectId().toString();
        const result = await runWithSession((session) => updateSegUtil({
            segId: missingId,
            updateData: { order: 2 },
            session,
        }));
        expect(result).toBeNull();
    });
    it("throws when zones not found", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-nf`, order: 1, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        const missingZoneId = new mongoose.Types.ObjectId().toString();
        await expect(runWithSession((session) => updateSegUtil({
            segId: seg._id.toString(),
            updateData: { zones: [missingZoneId] },
            session,
        }))).rejects.toThrow(/one or more zones not found/i);
    });
    it("throws when zones belong to other segments", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-conf`, order: 1, segs: [] });
        const zone = await createZone();
        const otherSegId = new mongoose.Types.ObjectId();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        await Zone.updateOne({ _id: zone._id }, { $set: { "seg.id": otherSegId, sector: 1001 } });
        await expect(runWithSession((session) => updateSegUtil({
            segId: seg._id.toString(),
            updateData: { zones: [zone._id.toString()] },
            session,
        }))).rejects.toThrow(/zones already belong to other segments/i);
    });
});
