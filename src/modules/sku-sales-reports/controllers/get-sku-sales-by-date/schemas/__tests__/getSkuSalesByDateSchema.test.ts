import { describe, expect, it } from "vitest";
import { getSkuSalesByDateSchema } from "../getSkuSalesByDateSchema.js";

const VALID_SKU_ID = "507f1f77bcf86cd799439011";

describe("getSkuSalesByDateSchema", () => {
  it("parses valid skuId and date", () => {
    const result = getSkuSalesByDateSchema.safeParse({
      skuId: VALID_SKU_ID,
      date: "2026-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = getSkuSalesByDateSchema.safeParse({
      skuId: VALID_SKU_ID,
      date: "2026/06/01",
    });
    expect(result.success).toBe(false);
  });
});
