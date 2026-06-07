import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getSkugrSliceExcelUtil } from "../getSkugrSliceExcelUtil.js";

describe("getSkugrSliceExcelUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("returns ok false when skugr has no skus", async () => {
    const skugr = await Skugr.create({
      konkName: "x",
      prodName: "y",
      title: "Empty",
      url: "https://e.com/g",
      isSliced: true,
      skus: [],
    });

    const result = await getSkugrSliceExcelUtil({
      skugrId: skugr._id.toString(),
      dateFrom: new Date("2026-06-01T00:00:00.000Z"),
      dateTo: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(result.ok).toBe(false);
  });

  it("returns excel buffer and filename for skugr with slice data", async () => {
    const sku = await Sku.create({
      konkName: "slice-gr",
      prodName: "pr",
      productId: "slice-gr-1",
      title: "Item",
      url: "https://e.com/s",
    });
    const skugr = await Skugr.create({
      konkName: "slice-gr",
      prodName: "pr",
      title: "Grp",
      url: "https://e.com/g",
      isSliced: true,
      skus: [sku._id],
    });
    await SkuSlice.create({
      konkName: "slice-gr",
      date: new Date("2026-06-01T00:00:00.000Z"),
      data: { "slice-gr-1": { stock: 3, price: 7 } },
    });

    const result = await getSkugrSliceExcelUtil({
      skugrId: skugr._id.toString(),
      dateFrom: new Date("2026-06-01T00:00:00.000Z"),
      dateTo: new Date("2026-06-01T00:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.fileName).toContain("sku_slice_skugr_");
  });
});
