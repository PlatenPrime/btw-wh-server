import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../../blocks/models/Block.js";
import { Seg } from "../../../../../segs/models/Seg.js";
import { Zone } from "../../../../models/Zone.js";
import { getZonesByBlockIdUtil } from "../getZonesByBlockIdUtil.js";
describe("getZonesByBlockIdUtil", () => {
    beforeEach(async () => {
        await Zone.deleteMany({});
        await Seg.deleteMany({});
        await Block.deleteMany({});
    });
    it("returns zones linked to segments of the block", async () => {
        const block = await Block.create({ title: "Block 1", order: 1, segs: [] });
        const zoneA = await Zone.create({ title: "42-1", bar: 4201, sector: 0 });
        const zoneB = await Zone.create({ title: "42-2", bar: 4202, sector: 0 });
        await Zone.create({ title: "99-1", bar: 9901, sector: 0 });
        await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 0,
            zones: [
                { _id: zoneA._id, title: zoneA.title },
                { _id: zoneB._id, title: zoneB.title },
            ],
        });
        const zones = await getZonesByBlockIdUtil({
            blockId: block._id.toString(),
        });
        expect(zones).toHaveLength(2);
        expect(zones.map((z) => z.title).sort()).toEqual(["42-1", "42-2"]);
    });
    it("returns empty array when block has no segments", async () => {
        const block = await Block.create({ title: "Empty Block", order: 1, segs: [] });
        const zones = await getZonesByBlockIdUtil({
            blockId: block._id.toString(),
        });
        expect(zones).toEqual([]);
    });
    it("aggregates zones from multiple segments", async () => {
        const block = await Block.create({ title: "Block 2", order: 1, segs: [] });
        const zoneA = await Zone.create({ title: "10-1", bar: 1010, sector: 0 });
        const zoneB = await Zone.create({ title: "10-2", bar: 1020, sector: 0 });
        await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 0,
            zones: [{ _id: zoneA._id, title: zoneA.title }],
        });
        await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 2,
            sector: 0,
            zones: [{ _id: zoneB._id, title: zoneB.title }],
        });
        const zones = await getZonesByBlockIdUtil({
            blockId: block._id.toString(),
        });
        expect(zones).toHaveLength(2);
    });
});
