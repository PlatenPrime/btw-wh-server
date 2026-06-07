import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Block } from "../../../../../blocks/models/Block.js";
import { Zone } from "../../../../../zones/models/Zone.js";
import { Seg } from "../../../../models/Seg.js";
import { getZonesBySegIdUtil } from "../getZonesBySegIdUtil.js";
describe("getZonesBySegIdUtil", () => {
    const createZone = async () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 99) + 1;
        return Zone.create({
            title: `42-${(timestamp % 99) + 1}-${random}`,
            bar: Math.max(1, Math.floor(Math.random() * 1_000_000)),
            sector: 0,
        });
    };
    it("returns zones linked to segment", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
        const zoneA = await createZone();
        const zoneB = await createZone();
        const otherZone = await createZone();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [
                { _id: zoneA._id, title: zoneA.title },
                { _id: zoneB._id, title: zoneB.title },
            ],
        });
        await Zone.updateMany({ _id: { $in: [zoneA._id, zoneB._id] } }, { $set: { "seg.id": seg._id, sector: seg.sector } });
        const result = await getZonesBySegIdUtil({ segId: seg._id.toString() });
        expect(result).toHaveLength(2);
        const resultIds = result.map((zone) => zone._id.toString()).sort();
        expect(resultIds).toEqual([zoneA._id.toString(), zoneB._id.toString()].sort());
        expect(resultIds).not.toContain(otherZone._id.toString());
    });
    it("returns empty array when no zones linked", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-nz`, order: 1, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        const result = await getZonesBySegIdUtil({ segId: seg._id.toString() });
        expect(result).toEqual([]);
    });
    it("returns empty array for non-existent segment id", async () => {
        const missingId = new mongoose.Types.ObjectId().toString();
        const result = await getZonesBySegIdUtil({ segId: missingId });
        expect(result).toEqual([]);
    });
});
