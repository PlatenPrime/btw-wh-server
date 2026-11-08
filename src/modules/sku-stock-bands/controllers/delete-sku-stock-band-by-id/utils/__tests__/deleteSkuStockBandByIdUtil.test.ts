import { beforeEach, describe, expect, it } from "vitest";
import { SkuStockBand } from "../../../../models/SkuStockBand.js";
import { deleteSkuStockBandByIdUtil } from "../deleteSkuStockBandByIdUtil.js";

describe("deleteSkuStockBandByIdUtil", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
  });

  it("deletes existing band", async () => {
    const created = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    const deleted = await deleteSkuStockBandByIdUtil(String(created._id));
    expect(deleted?._id.toString()).toBe(String(created._id));
    expect(await SkuStockBand.countDocuments()).toBe(0);
  });

  it("returns null for missing", async () => {
    const deleted = await deleteSkuStockBandByIdUtil("507f1f77bcf86cd799439011");
    expect(deleted).toBeNull();
  });
});
