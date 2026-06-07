import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Block } from "../../../../../blocks/models/Block.js";
import { Seg } from "../../../../models/Seg.js";
import { getSegByIdUtil } from "../getSegByIdUtil.js";
describe("getSegByIdUtil", () => {
    it("returns segment when found", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        const result = await getSegByIdUtil({ id: seg._id.toString() });
        expect(result).not.toBeNull();
        expect(result?._id.toString()).toBe(seg._id.toString());
        expect(result?.order).toBe(1);
    });
    it("returns null when segment not found", async () => {
        const missingId = new mongoose.Types.ObjectId().toString();
        const result = await getSegByIdUtil({ id: missingId });
        expect(result).toBeNull();
    });
});
