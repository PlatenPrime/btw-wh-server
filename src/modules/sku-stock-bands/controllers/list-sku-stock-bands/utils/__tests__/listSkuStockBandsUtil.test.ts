import { beforeEach, describe, expect, it } from "vitest";
import { SkuStockBand } from "../../../../models/SkuStockBand.js";
import { listSkuStockBandsUtil } from "../listSkuStockBandsUtil.js";

describe("listSkuStockBandsUtil", () => {
  beforeEach(async () => {
    await SkuStockBand.deleteMany({});
    await SkuStockBand.create([
      {
        konk: { name: "balun", title: "BALUN" },
        stockMin: 9500,
        stockMax: 10500,
        normalMax: 500,
      },
      {
        konk: { name: "svbum", title: "SVBUM" },
        stockMin: 5_000_000,
        stockMax: 6_000_000,
        normalMax: 100_000,
      },
    ]);
  });

  it("lists all bands", async () => {
    const list = await listSkuStockBandsUtil({});
    expect(list).toHaveLength(2);
  });

  it("filters by konkName", async () => {
    const list = await listSkuStockBandsUtil({ konkName: "balun" });
    expect(list).toHaveLength(1);
    expect(list[0]?.konk.name).toBe("balun");
  });
});
