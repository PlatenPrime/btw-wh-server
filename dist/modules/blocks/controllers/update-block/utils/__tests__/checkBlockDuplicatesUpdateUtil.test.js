import { describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../models/Block.js";
import { checkBlockDuplicatesUpdateUtil } from "../checkBlockDuplicatesUpdateUtil.js";
describe("checkBlockDuplicatesUpdateUtil", () => {
    it("returns null when title is not provided", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const result = await checkBlockDuplicatesUpdateUtil({
            id: block._id.toString(),
        });
        expect(result).toBeNull();
    });
    it("returns null when no duplicate exists", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        await Block.create({ title: "Block B", order: 2, segs: [] });
        const result = await checkBlockDuplicatesUpdateUtil({
            id: block._id.toString(),
            title: "Block C",
        });
        expect(result).toBeNull();
    });
    it("returns duplicate block when another block has same title", async () => {
        const blockA = await Block.create({ title: "Block A", order: 1, segs: [] });
        const blockB = await Block.create({ title: "Block B", order: 2, segs: [] });
        const result = await checkBlockDuplicatesUpdateUtil({
            id: blockA._id.toString(),
            title: "Block B",
        });
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(blockB._id.toString());
    });
    it("does not return the block being updated", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const result = await checkBlockDuplicatesUpdateUtil({
            id: block._id.toString(),
            title: "Block A",
        });
        expect(result).toBeNull();
    });
});
