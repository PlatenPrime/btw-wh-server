import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Block } from "../../../../../blocks/models/Block.js";
import { Zone } from "../../../../../zones/models/Zone.js";
import { Seg } from "../../../../models/Seg.js";
import { createSegUtil } from "../createSegUtil.js";
describe("createSegUtil", () => {
    const createZone = async (overrides = {}) => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 99) + 1;
        return Zone.create({
            title: overrides.title ?? `42-${(timestamp % 99) + 1}-${random}`,
            bar: overrides.bar ?? Math.max(1, Math.floor(Math.random() * 1_000_000)),
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
    it("creates segment, updates block.segs and assigns zones", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}`, order: 2, segs: [] });
        const zoneA = await createZone();
        const zoneB = await createZone();
        const createdSeg = await runWithSession((session) => createSegUtil({
            blockData: block,
            order: 3,
            zones: [zoneA._id.toString(), zoneB._id.toString()],
            session,
        }));
        expect(createdSeg.order).toBe(3);
        expect(createdSeg.sector).toBe(2003);
        expect(createdSeg.zones).toHaveLength(2);
        const updatedBlock = await Block.findById(block._id).lean().exec();
        expect(updatedBlock?.segs.map((id) => id.toString())).toContain(createdSeg._id.toString());
        const updatedZoneA = await Zone.findById(zoneA._id).lean().exec();
        expect(updatedZoneA?.seg?.id?.toString()).toBe(createdSeg._id.toString());
        expect(updatedZoneA?.sector).toBe(2003);
    });
    it("throws when one or more zones not found", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-nf`, order: 1, segs: [] });
        const missingZoneId = new mongoose.Types.ObjectId().toString();
        await expect(runWithSession((session) => createSegUtil({
            blockData: block,
            order: 1,
            zones: [missingZoneId],
            session,
        }))).rejects.toThrow(/one or more zones not found/i);
    });
    it("throws when zones already belong to segments", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-dup`, order: 1, segs: [] });
        const zone = await createZone();
        const existingSeg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [{ _id: zone._id, title: zone.title }],
        });
        await Zone.updateOne({ _id: zone._id }, { $set: { "seg.id": existingSeg._id, sector: existingSeg.sector } });
        await expect(runWithSession((session) => createSegUtil({
            blockData: block,
            order: 2,
            zones: [zone._id.toString()],
            session,
        }))).rejects.toThrow(/zones already belong to segments/i);
    });
});
