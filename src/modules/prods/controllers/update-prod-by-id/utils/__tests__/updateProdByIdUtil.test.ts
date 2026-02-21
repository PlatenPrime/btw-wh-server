import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../models/Prod.js";
import { updateProdByIdUtil } from "../updateProdByIdUtil.js";

describe("updateProdByIdUtil", () => {
  beforeEach(async () => {
    await Prod.deleteMany({});
  });

  it("returns null when prod not found", async () => {
    const result = await updateProdByIdUtil({
      id: "000000000000000000000000",
      title: "New",
    });
    expect(result).toBeNull();
  });

  it("updates only provided fields and returns updated document", async () => {
    const prod = await Prod.create({
      name: "old",
      title: "Old Title",
      imageUrl: "https://old.com/1.png",
    });
    const result = await updateProdByIdUtil({
      id: prod._id.toString(),
      title: "New Title",
    });
    expect(result?.title).toBe("New Title");
    expect(result?.name).toBe("old");
    expect(result?.imageUrl).toBe("https://old.com/1.png");
    const found = await Prod.findById(prod._id);
    expect(found?.title).toBe("New Title");
  });

  it("when no fields provided returns current document", async () => {
    const prod = await Prod.create({
      name: "x",
      title: "X",
      imageUrl: "https://x.com/1.png",
    });
    const result = await updateProdByIdUtil({ id: prod._id.toString() });
    expect(result?.name).toBe("x");
    expect(result?.title).toBe("X");
  });
});
