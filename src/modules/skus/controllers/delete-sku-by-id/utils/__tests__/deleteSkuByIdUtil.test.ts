import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../models/Sku.js";
import { deleteSkuByIdUtil } from "../deleteSkuByIdUtil.js";

describe("deleteSkuByIdUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
  });

  it("returns null when sku not found", async () => {
    const result = await deleteSkuByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("deletes sku and returns deleted document", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      title: "To delete",
      url: "https://k1.com/delete",
    });

    const result = await deleteSkuByIdUtil(sku._id.toString());
    expect(result?.title).toBe("To delete");

    const found = await Sku.findById(sku._id);
    expect(found).toBeNull();
  });
});
