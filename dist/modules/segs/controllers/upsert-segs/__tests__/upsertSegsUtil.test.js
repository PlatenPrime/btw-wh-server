import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../../blocks/models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { Seg } from "../../../models/Seg.js";
import { upsertSegsUtil } from "../utils/upsertSegsUtil.js";
describe("upsertSegsUtil", () => {
    const createZone = async (overrides = {}) => {
        return Zone.create({
            title: overrides.title ?? `42-1-${Date.now()}-${Math.random()}`,
            bar: overrides.bar ??
                Math.max(1, Math.floor(Math.random() * 1_000_000)),
            sector: overrides.sector ?? 0,
        });
    };
    it("creates new segments and assigns zones", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const zoneA = await createZone();
        const zoneB = await createZone();
        const session = await mongoose.startSession();
        let segId = null;
        try {
            await session.withTransaction(async () => {
                const result = await upsertSegsUtil({
                    segs: [
                        {
                            blockId: block._id.toString(),
                            order: 1,
                            zones: [zoneA._id.toString(), zoneB._id.toString()],
                        },
                    ],
                    session,
                });
                segId = result.processedSegs[0]._id.toString();
            });
        }
        finally {
            await session.endSession();
        }
        const createdSeg = await Seg.findOne({ block: block._id }).lean().exec();
        expect(createdSeg).not.toBeNull();
        expect(createdSeg?.zones).toHaveLength(2);
        const updatedZone = await Zone.findById(zoneA._id).lean().exec();
        expect(updatedZone?.seg?.id?.toString()).toBe(segId);
        expect(updatedZone?.sector).toBe(block.order * 1000 + 1);
    });
    it("updates existing segment, reassigns zones and resets removed ones", async () => {
        const block = await Block.create({ title: "Block B", order: 3, segs: [] });
        const zoneInitial = await createZone();
        const zoneNew = await createZone();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: block.order * 1000 + 1,
            zones: [{ _id: zoneInitial._id, title: zoneInitial.title }],
        });
        await Zone.updateOne({ _id: zoneInitial._id }, {
            $set: { "seg.id": seg._id, sector: seg.sector },
        });
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await upsertSegsUtil({
                    segs: [
                        {
                            _id: seg._id.toString(),
                            blockId: block._id.toString(),
                            order: 2,
                            zones: [zoneNew._id.toString()],
                        },
                    ],
                    session,
                });
            });
        }
        finally {
            await session.endSession();
        }
        const updatedSeg = await Seg.findById(seg._id).lean().exec();
        expect(updatedSeg?.order).toBe(2);
        expect(updatedSeg?.zones).toHaveLength(1);
        expect(updatedSeg?.zones[0]._id.toString()).toBe(zoneNew._id.toString());
        expect(updatedSeg?.zones[0].title).toBe(zoneNew.title);
        const removedZone = await Zone.findById(zoneInitial._id).lean().exec();
        expect(removedZone?.seg).toBeUndefined();
        expect(removedZone?.sector).toBe(0);
        const reassignedZone = await Zone.findById(zoneNew._id).lean().exec();
        expect(reassignedZone?.seg?.id?.toString()).toBe(seg._id.toString());
        expect(reassignedZone?.sector).toBe(block.order * 1000 + 2);
    });
    it("throws when zones belong to another segment", async () => {
        const block = await Block.create({ title: "Block C", order: 4, segs: [] });
        const zone = await createZone();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: block.order * 1000 + 1,
            zones: [{ _id: zone._id, title: zone.title }],
        });
        await Zone.updateOne({ _id: zone._id }, { $set: { "seg.id": seg._id, sector: seg.sector } });
        const session = await mongoose.startSession();
        try {
            await expect(session.withTransaction(async () => {
                await upsertSegsUtil({
                    segs: [
                        {
                            blockId: block._id.toString(),
                            order: 2,
                            zones: [zone._id.toString()],
                        },
                    ],
                    session,
                });
            })).rejects.toThrow(/already belong to other segments/i);
        }
        finally {
            await session.endSession();
        }
    });
});
