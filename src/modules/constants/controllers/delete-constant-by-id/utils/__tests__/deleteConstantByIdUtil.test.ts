import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../../../models/Constant.js";
import { deleteConstantByIdUtil } from "../deleteConstantByIdUtil.js";

describe("deleteConstantByIdUtil", () => {
  beforeEach(async () => {
    await Constant.deleteMany({});
  });

  it("returns null when constant not found", async () => {
    const result = await deleteConstantByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("deletes constant and returns deleted document", async () => {
    const constant = await Constant.create({
      name: "to-delete",
      title: "To Delete",
      data: {},
    });
    const result = await deleteConstantByIdUtil(constant._id.toString());
    expect(result).toBeTruthy();
    expect(result?.name).toBe("to-delete");
    const found = await Constant.findById(constant._id);
    expect(found).toBeNull();
  });
});
