import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { Prod } from "../../../../../prods/models/Prod.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { getSelectionSkuSliceExcelUtil } from "../getSelectionSkuSliceExcelUtil.js";

describe("getSelectionSkuSliceExcelUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Konk.deleteMany({});
    await Prod.deleteMany({});
  });

  it("returns ok:false when no skus found", async () => {
    const result = await getSelectionSkuSliceExcelUtil({
      skuIds: ["507f1f77bcf86cd799439011"],
      dateFrom: new Date("2026-01-01T00:00:00.000Z"),
      dateTo: new Date("2026-01-02T00:00:00.000Z"),
    });
    expect(result).toEqual({ ok: false });
  });

  it("builds xlsx for multi-konk selection", async () => {
    await Konk.create({
      name: "air",
      title: "Air UA",
      url: "https://e.com/air",
      imageUrl: "https://e.com/air.png",
      recountDays: [],
    });
    await Prod.create({
      name: "gemar",
      title: "Gemar",
      imageUrl: "https://e.com/g.png",
    });

    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-1",
      title: "Balloon",
      url: "https://e.com/air-1",
    });

    const result = await getSelectionSkuSliceExcelUtil({
      skuIds: [sku._id.toString()],
      dateFrom: new Date("2026-01-01T00:00:00.000Z"),
      dateTo: new Date("2026-01-02T00:00:00.000Z"),
      metrics: ["stock"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.fileName).toContain("sku_slice_selection_1_");
  });
});
