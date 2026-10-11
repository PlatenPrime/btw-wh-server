import { beforeEach, describe, expect, it } from "vitest";
import { seedSkuSliceMonthDay } from "../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../../sku-slices/models/SkuSliceMonth.js";
import { getSliceItem } from "../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../loadExcelSliceMapsForSkus.js";

describe("loadExcelSliceMapsForSkus", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
  });

  it("returns empty maps for empty sku list", async () => {
    const maps = await loadExcelSliceMapsForSkus(
      [],
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-02T00:00:00.000Z"),
    );
    expect(maps.size).toBe(0);
  });

  it("loads only requested productIds into maps", async () => {
    const d = new Date("2026-06-05T00:00:00.000Z");
    await seedSkuSliceMonthDay("excel-k", d, {
      "excel-k-a": { stock: 10, price: 2 },
      "excel-k-b": { stock: 20, price: 3 },
      "excel-k-c": { stock: 30, price: 4 },
    });

    const maps = await loadExcelSliceMapsForSkus(
      [
        { konkName: "excel-k", productId: "excel-k-a" },
        { konkName: "excel-k", productId: "excel-k-b" },
      ],
      d,
      d,
    );

    expect(getSliceItem(maps, "excel-k", "excel-k-a", d)).toEqual({
      stock: 10,
      price: 2,
    });
    expect(getSliceItem(maps, "excel-k", "excel-k-b", d)).toEqual({
      stock: 20,
      price: 3,
    });
    expect(getSliceItem(maps, "excel-k", "excel-k-c", d)).toBeUndefined();

    const dayRec = maps.get("excel-k")?.get(d.getTime());
    expect(dayRec).toBeDefined();
    expect(Object.keys(dayRec!).sort()).toEqual(["excel-k-a", "excel-k-b"]);
  });
});
