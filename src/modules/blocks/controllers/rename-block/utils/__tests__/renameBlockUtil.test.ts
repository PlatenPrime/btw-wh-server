import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../models/Block.js";
import { renameBlockUtil } from "../renameBlockUtil.js";

describe("renameBlockUtil", () => {
  it("renames block and returns updated document", async () => {
    const block = await Block.create({ title: "Old Title", order: 1, segs: [] });

    const result = await renameBlockUtil({
      id: block._id.toString(),
      title: "New Title",
    });

    expect(result).toBeTruthy();
    expect(result?.title).toBe("New Title");
    expect(result?.order).toBe(1);

    const updated = await Block.findById(block._id).lean().exec();
    expect(updated?.title).toBe("New Title");
  });

  it("returns null when block not found", async () => {
    const result = await renameBlockUtil({
      id: new mongoose.Types.ObjectId().toString(),
      title: "New Title",
    });

    expect(result).toBeNull();
  });
});
