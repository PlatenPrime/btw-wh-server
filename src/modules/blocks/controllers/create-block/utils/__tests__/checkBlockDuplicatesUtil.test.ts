import { describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Block } from "../../../../models/Block.js";
import { checkBlockDuplicatesUtil } from "../checkBlockDuplicatesUtil.js";

describe("checkBlockDuplicatesUtil", () => {
  it("returns null when no duplicate exists", async () => {
    await Block.create({ title: "Existing Block", order: 1, segs: [] });

    const result = await checkBlockDuplicatesUtil({ title: "New Block" });

    expect(result).toBeNull();
  });

  it("returns existing block when title matches", async () => {
    const existing = await Block.create({
      title: "Duplicate Title",
      order: 1,
      segs: [],
    });

    const result = await checkBlockDuplicatesUtil({ title: "Duplicate Title" });

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(existing._id.toString());
  });

  it("is case-sensitive for title matching", async () => {
    await Block.create({ title: "Block A", order: 1, segs: [] });

    const result = await checkBlockDuplicatesUtil({ title: "block a" });

    expect(result).toBeNull();
  });
});
