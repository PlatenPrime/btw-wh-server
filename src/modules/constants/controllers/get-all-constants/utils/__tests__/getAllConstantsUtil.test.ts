import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../../../models/Constant.js";
import { getAllConstantsUtil } from "../getAllConstantsUtil.js";

describe("getAllConstantsUtil", () => {
  beforeEach(async () => {
    await Constant.deleteMany({});
  });

  it("returns empty array when no constants", async () => {
    const result = await getAllConstantsUtil();
    expect(result).toEqual([]);
  });

  it("returns all constants with full fields", async () => {
    await Constant.create({
      name: "a",
      title: "A",
      data: { x: "y" },
    });
    const result = await getAllConstantsUtil();
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "a");
    expect(result[0]).toHaveProperty("title", "A");
    expect(result[0]).toHaveProperty("data", { x: "y" });
    expect(result[0]).toHaveProperty("_id");
    expect(result[0]).toHaveProperty("createdAt");
    expect(result[0]).toHaveProperty("updatedAt");
  });

  it("returns multiple constants sorted by createdAt desc", async () => {
    await Constant.create({ name: "first", title: "First", data: {} });
    await Constant.create({ name: "second", title: "Second", data: {} });
    const result = await getAllConstantsUtil();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("second");
    expect(result[1].name).toBe("first");
  });
});
