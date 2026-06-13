import { describe, expect, it } from "vitest";
import { konkProdRangeSchema } from "../../../../../sku-reporting/schemas/konkProdRangeSchema.js";
import { getKonkSkuSliceExcelSchema } from "../getKonkSkuSliceExcelSchema.js";

describe("getKonkSkuSliceExcelSchema", () => {
  it("re-exports konkProdRangeSchema", () => {
    expect(getKonkSkuSliceExcelSchema).toBe(konkProdRangeSchema);
  });
});
