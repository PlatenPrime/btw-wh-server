import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { serializeIds } from "../serialize-ids.js";
describe("serializeIds", () => {
    it("returns primitives unchanged", () => {
        expect(serializeIds(null)).toBeNull();
        expect(serializeIds("text")).toBe("text");
        expect(serializeIds(42)).toBe(42);
    });
    it("converts ObjectId fields to strings", () => {
        const id = new Types.ObjectId();
        expect(serializeIds({ id })).toEqual({ id: id.toString() });
    });
    it("recursively serializes nested document-like structures", () => {
        const rowId = new Types.ObjectId();
        const poseId = new Types.ObjectId();
        const result = serializeIds({
            row: rowId,
            poses: [{ _id: poseId }],
        });
        expect(result).toEqual({
            row: rowId.toString(),
            poses: [{ _id: poseId.toString() }],
        });
    });
});
