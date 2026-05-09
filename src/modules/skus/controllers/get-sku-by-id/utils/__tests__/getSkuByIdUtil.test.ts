import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../../models/Sku.js";
import { getSkuByIdUtil } from "../getSkuByIdUtil.js";

describe("getSkuByIdUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await getSkuByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("returns sku with skugrs empty when not in any group", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-8",
      title: "Sku 1",
      url: "https://k1.com/sku1",
    });

    const result = await getSkuByIdUtil(sku._id.toString());
    expect(result).not.toBeNull();
    expect(result!._id.toString()).toBe(sku._id.toString());
    expect(result!.title).toBe("Sku 1");
    expect(result!.skugrs).toEqual([]);
  });

  it("returns sku with skugrs sorted by _id", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-9",
      title: "In groups",
      url: "https://k1.com/sku9",
    });

    const g2 = await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "Second",
      url: "https://k1.com/g2",
      skus: [sku._id],
    });
    const g1 = await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "First",
      url: "https://k1.com/g1",
      skus: [sku._id],
    });

    const result = await getSkuByIdUtil(sku._id.toString());
    expect(result!.skugrs).toHaveLength(2);
    expect(result!.skugrs[0]!._id.toString()).toBe(g2._id.toString());
    expect(result!.skugrs[1]!._id.toString()).toBe(g1._id.toString());
    expect(result!.skugrs[0]!.title).toBe("Second");
    expect(result!.skugrs[1]!.title).toBe("First");
  });
});
