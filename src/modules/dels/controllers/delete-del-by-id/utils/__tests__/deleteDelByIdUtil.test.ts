import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../../../models/Del.js";
import { deleteDelByIdUtil } from "../deleteDelByIdUtil.js";

describe("deleteDelByIdUtil", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
  });

  it("returns null when del not found", async () => {
    const result = await deleteDelByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("deletes del and returns deleted document", async () => {
    const del = await Del.create({
      title: "To delete",
      prodName: "prod1",
      artikuls: {},
    });
    const result = await deleteDelByIdUtil(del._id.toString());
    expect(result).toBeTruthy();
    expect(result?.title).toBe("To delete");
    const found = await Del.findById(del._id);
    expect(found).toBeNull();
  });
});
