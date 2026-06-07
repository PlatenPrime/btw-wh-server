import { describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../models/Block.js";
import { createBlockUtil } from "../createBlockUtil.js";
describe("createBlockUtil", () => {
    it("creates block with order 1 when no blocks exist", async () => {
        const result = await createBlockUtil({ title: "First Block" });
        expect(result.title).toBe("First Block");
        expect(result.order).toBe(1);
        expect(result._id).toBeDefined();
        const found = await Block.findById(result._id);
        expect(found).not.toBeNull();
    });
    it("assigns order as max existing order + 1", async () => {
        await Block.create({ title: "Block 1", order: 1, segs: [] });
        await Block.create({ title: "Block 2", order: 5, segs: [] });
        const result = await createBlockUtil({ title: "Block 3" });
        expect(result.order).toBe(6);
    });
    it("adds timestamps automatically", async () => {
        const result = await createBlockUtil({ title: "Timestamp Block" });
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
    });
});
