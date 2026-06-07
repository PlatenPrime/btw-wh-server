import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { createTestZone } from "../../../../../../test/setup.js";
import "../../../../../../test/setup.js";
import { Seg } from "../../../../../segs/models/Seg.js";
import { Zone } from "../../../../../zones/models/Zone.js";
import { Block } from "../../../../models/Block.js";
import { deleteBlockByIdUtil } from "../deleteBlockByIdUtil.js";

describe("deleteBlockByIdUtil", () => {
  it("returns null when block not found", async () => {
    const result = await deleteBlockByIdUtil({
      id: "507f1f77bcf86cd799439011",
    });

    expect(result).toBeNull();
  });

  it("deletes block and returns deleted document", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });

    const result = await deleteBlockByIdUtil({ id: block._id.toString() });

    expect(result).toBeTruthy();
    expect(result?.title).toBe("Block A");

    const deleted = await Block.findById(block._id);
    expect(deleted).toBeNull();
  });

  it("deletes all segments belonging to the block", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    await deleteBlockByIdUtil({ id: block._id.toString() });

    const deletedSeg = await Seg.findById(seg._id);
    expect(deletedSeg).toBeNull();
  });

  it("resets sector and removes seg reference from zones in block segments", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });
    const zone = await createTestZone({ title: "42-1-1", bar: 420101, sector: 1001 });
    await Zone.findByIdAndUpdate(zone._id, {
      seg: { id: new mongoose.Types.ObjectId(), title: "Seg 1" },
    });

    await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [{ _id: zone._id, title: zone.title }],
    });

    await deleteBlockByIdUtil({ id: block._id.toString() });

    const updatedZone = await Zone.findById(zone._id).lean().exec();
    expect(updatedZone?.sector).toBe(0);
    expect(updatedZone?.seg).toBeUndefined();
  });
});
