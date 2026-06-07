import { describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../models/Block.js";
import { getAllBlocksUtil } from "../getAllBlocksUtil.js";
describe("getAllBlocksUtil", () => {
    it("returns empty array when no blocks exist", async () => {
        const result = await getAllBlocksUtil();
        expect(result).toEqual([]);
    });
    it("returns all blocks sorted by order ascending", async () => {
        await Block.create({ title: "Block C", order: 3, segs: [] });
        await Block.create({ title: "Block A", order: 1, segs: [] });
        await Block.create({ title: "Block B", order: 2, segs: [] });
        const result = await getAllBlocksUtil();
        expect(result).toHaveLength(3);
        expect(result[0].title).toBe("Block A");
        expect(result[1].title).toBe("Block B");
        expect(result[2].title).toBe("Block C");
    });
});
