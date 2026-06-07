import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../models/Block.js";
import { Seg } from "../../../../../segs/models/Seg.js";
import { updateBlockUtil } from "../updateBlockUtil.js";

describe("updateBlockUtil", () => {
  it("returns null when block not found", async () => {
    const result = await updateBlockUtil({
      id: new mongoose.Types.ObjectId().toString(),
      updateData: { title: "New Title" },
    });

    expect(result).toBeNull();
  });

  it("returns existing block when updateData is empty", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });

    const result = await updateBlockUtil({
      id: block._id.toString(),
      updateData: {},
    });

    expect(result).toBeTruthy();
    expect(result?.title).toBe("Block A");
  });

  it("updates title and order", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });

    const result = await updateBlockUtil({
      id: block._id.toString(),
      updateData: { title: "Updated Block", order: 5 },
    });

    expect(result?.title).toBe("Updated Block");
    expect(result?.order).toBe(5);
  });

  it("updates segs array when segments belong to block", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });
    const seg1 = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });
    const seg2 = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 2,
      sector: 1002,
      zones: [],
    });

    const result = await updateBlockUtil({
      id: block._id.toString(),
      updateData: { segs: [seg1._id.toString(), seg2._id.toString()] },
    });

    expect(result?.segs).toHaveLength(2);
    expect(result?.segs.map((id) => id.toString())).toContain(seg1._id.toString());
    expect(result?.segs.map((id) => id.toString())).toContain(seg2._id.toString());
  });

  it("throws when segments do not belong to block", async () => {
    const blockA = await Block.create({ title: "Block A", order: 1, segs: [] });
    const blockB = await Block.create({ title: "Block B", order: 2, segs: [] });
    const seg = await Seg.create({
      block: blockA._id,
      blockData: { _id: blockA._id, title: blockA.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    await expect(
      updateBlockUtil({
        id: blockB._id.toString(),
        updateData: { segs: [seg._id.toString()] },
      })
    ).rejects.toThrow(/segments not found or do not belong/i);
  });
});
