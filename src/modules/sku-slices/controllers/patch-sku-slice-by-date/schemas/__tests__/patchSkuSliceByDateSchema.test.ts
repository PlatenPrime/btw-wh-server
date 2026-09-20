import { describe, expect, it } from "vitest";
import { patchSkuSliceByDateSchema } from "../patchSkuSliceByDateSchema.js";

const VALID_SKU_ID = "507f1f77bcf86cd799439011";

describe("patchSkuSliceByDateSchema", () => {
  const valid = {
    skuId: VALID_SKU_ID,
    date: "2026-06-01",
    stock: 3,
    price: 110,
  };

  it("parses valid payload including zero and -1", () => {
    expect(patchSkuSliceByDateSchema.safeParse(valid).success).toBe(true);
    expect(
      patchSkuSliceByDateSchema.safeParse({ ...valid, stock: 0, price: -1 })
        .success
    ).toBe(true);
  });

  it("rejects invalid skuId", () => {
    const result = patchSkuSliceByDateSchema.safeParse({
      ...valid,
      skuId: "bad-id",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-finite stock or price", () => {
    expect(
      patchSkuSliceByDateSchema.safeParse({ ...valid, stock: Number.NaN })
        .success
    ).toBe(false);
    expect(
      patchSkuSliceByDateSchema.safeParse({
        ...valid,
        price: Number.POSITIVE_INFINITY,
      }).success
    ).toBe(false);
  });

  it("rejects missing date", () => {
    const { date: _omit, ...rest } = valid;
    expect(patchSkuSliceByDateSchema.safeParse(rest).success).toBe(false);
  });
});
