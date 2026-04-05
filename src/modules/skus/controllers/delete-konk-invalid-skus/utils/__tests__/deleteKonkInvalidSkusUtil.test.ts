import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../models/Sku.js";
import { deleteKonkInvalidSkusUtil } from "../deleteKonkInvalidSkusUtil.js";

describe("deleteKonkInvalidSkusUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
  });

  it("deletes only invalid skus for konk", async () => {
    await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-bad",
      title: "Bad",
      url: "https://ex.com/bad",
      isInvalid: true,
    });
    await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-good",
      title: "Good",
      url: "https://ex.com/good",
      isInvalid: false,
    });
    await Sku.create({
      konkName: "other",
      prodName: "p",
      productId: "other-bad",
      title: "O",
      url: "https://ex.com/o",
      isInvalid: true,
    });

    const r = await deleteKonkInvalidSkusUtil("air");
    expect(r.deletedCount).toBe(1);
    const left = await Sku.find({}).sort({ productId: 1 }).lean();
    expect(left).toHaveLength(2);
    expect(left.map((s) => s.productId).sort()).toEqual(["air-good", "other-bad"]);
  });
});
