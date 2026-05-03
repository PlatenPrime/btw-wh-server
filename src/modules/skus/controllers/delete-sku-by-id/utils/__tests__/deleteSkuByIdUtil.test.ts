import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../../models/Sku.js";
import { deleteSkuByIdUtil } from "../deleteSkuByIdUtil.js";

describe("deleteSkuByIdUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("returns null when sku not found", async () => {
    const result = await deleteSkuByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("deletes sku and returns deleted document", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-7",
      title: "To delete",
      url: "https://k1.com/delete",
    });

    const result = await deleteSkuByIdUtil(sku._id.toString());
    expect(result?.title).toBe("To delete");

    const found = await Sku.findById(sku._id);
    expect(found).toBeNull();
  });

  it("pulls sku id from all skugrs before delete", async () => {
    const sku = await Sku.create({
      konkName: "k2",
      prodName: "p2",
      productId: "k2-shared",
      title: "Shared",
      url: "https://k2.com/shared",
    });
    const g1 = await Skugr.create({
      konkName: "k2",
      prodName: "p2",
      title: "G1",
      url: "https://k2.com/g1",
      skus: [sku._id],
    });
    const g2 = await Skugr.create({
      konkName: "k2",
      prodName: "p2",
      title: "G2",
      url: "https://k2.com/g2",
      skus: [sku._id],
    });

    await deleteSkuByIdUtil(sku._id.toString());

    const r1 = await Skugr.findById(g1._id).lean();
    const r2 = await Skugr.findById(g2._id).lean();
    expect(r1?.skus).toHaveLength(0);
    expect(r2?.skus).toHaveLength(0);
    expect(await Sku.findById(sku._id)).toBeNull();
  });
});
