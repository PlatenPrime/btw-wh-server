import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../models/Prod.js";
import { deleteProdByIdUtil } from "../deleteProdByIdUtil.js";

describe("deleteProdByIdUtil", () => {
  beforeEach(async () => {
    await Prod.deleteMany({});
  });

  it("returns null when prod not found", async () => {
    const result = await deleteProdByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("deletes prod and returns deleted document", async () => {
    const prod = await Prod.create({
      name: "to-delete",
      title: "To Delete",
      imageUrl: "https://x.com/1.png",
    });
    const result = await deleteProdByIdUtil(prod._id.toString());
    expect(result).toBeTruthy();
    expect(result?.name).toBe("to-delete");
    const found = await Prod.findById(prod._id);
    expect(found).toBeNull();
  });
});
