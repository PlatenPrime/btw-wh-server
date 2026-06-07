import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../models/Block.js";
import { getBlockByIdUtil } from "../getBlockByIdUtil.js";

describe("getBlockByIdUtil", () => {
  it("returns block when id exists", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });

    const result = await getBlockByIdUtil({ id: block._id.toString() });

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(block._id.toString());
    expect(result?.title).toBe("Block A");
  });

  it("returns null when block not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const result = await getBlockByIdUtil({ id: nonExistentId });

    expect(result).toBeNull();
  });
});
