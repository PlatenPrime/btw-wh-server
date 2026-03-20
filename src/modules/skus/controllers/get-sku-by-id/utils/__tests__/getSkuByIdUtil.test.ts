import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../models/Sku.js";
import { getSkuByIdUtil } from "../getSkuByIdUtil.js";

describe("getSkuByIdUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await getSkuByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("returns sku document by id", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      title: "Sku 1",
      url: "https://k1.com/sku1",
    });

    const result = await getSkuByIdUtil(sku._id.toString());
    expect(result?._id.toString()).toBe(sku._id.toString());
    expect(result?.title).toBe("Sku 1");
  });
});
