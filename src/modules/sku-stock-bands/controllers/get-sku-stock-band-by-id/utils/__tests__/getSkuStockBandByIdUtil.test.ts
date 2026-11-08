import { beforeEach, describe, expect, it } from "vitest";
import { SkuStockBand } from "../../../../models/SkuStockBand.js";
import { getSkuStockBandByIdUtil } from "../getSkuStockBandByIdUtil.js";

describe("getSkuStockBandByIdUtil", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
  });

  it("returns band by id", async () => {
    const created = await SkuStockBand.create({
      konk: { name: "balun", title: "BALUN" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    const found = await getSkuStockBandByIdUtil(String(created._id));
    expect(found?.stockMin).toBe(9500);
  });

  it("returns null for missing id", async () => {
    const found = await getSkuStockBandByIdUtil("507f1f77bcf86cd799439011");
    expect(found).toBeNull();
  });
});
