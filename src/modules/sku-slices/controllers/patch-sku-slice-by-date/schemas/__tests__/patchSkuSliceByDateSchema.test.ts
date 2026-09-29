import { describe, expect, it } from "vitest";
import {
  MAX_PATCH_RANGE_DAYS,
  patchSkuSliceByDateSchema,
} from "../patchSkuSliceByDateSchema.js";

const VALID_SKU_ID = "507f1f77bcf86cd799439011";

describe("patchSkuSliceByDateSchema", () => {
  const validSingle = {
    skuId: VALID_SKU_ID,
    date: "2026-06-01",
    stock: 3,
    price: 110,
  };

  const validRange = {
    skuId: VALID_SKU_ID,
    dateFrom: "2026-06-01",
    dateTo: "2026-06-03",
    stock: 3,
    price: 110,
  };

  it("parses valid single-day payload including zero and -1", () => {
    expect(patchSkuSliceByDateSchema.safeParse(validSingle).success).toBe(true);
    expect(
      patchSkuSliceByDateSchema.safeParse({
        ...validSingle,
        stock: 0,
        price: -1,
      }).success
    ).toBe(true);
  });

  it("parses valid range payload", () => {
    const result = patchSkuSliceByDateSchema.safeParse(validRange);
    expect(result.success).toBe(true);
    if (result.success) {
      expect("dateFrom" in result.data).toBe(true);
      expect("dateTo" in result.data).toBe(true);
    }
  });

  it("rejects invalid skuId", () => {
    const result = patchSkuSliceByDateSchema.safeParse({
      ...validSingle,
      skuId: "bad-id",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-finite stock or price", () => {
    expect(
      patchSkuSliceByDateSchema.safeParse({
        ...validSingle,
        stock: Number.NaN,
      }).success
    ).toBe(false);
    expect(
      patchSkuSliceByDateSchema.safeParse({
        ...validSingle,
        price: Number.POSITIVE_INFINITY,
      }).success
    ).toBe(false);
  });

  it("rejects missing date and missing range", () => {
    const { date: _omit, ...rest } = validSingle;
    expect(patchSkuSliceByDateSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects XOR mix of date and dateFrom/dateTo", () => {
    expect(
      patchSkuSliceByDateSchema.safeParse({
        ...validSingle,
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      }).success
    ).toBe(false);
  });

  it("rejects dateFrom after dateTo", () => {
    expect(
      patchSkuSliceByDateSchema.safeParse({
        ...validRange,
        dateFrom: "2026-06-10",
        dateTo: "2026-06-01",
      }).success
    ).toBe(false);
  });

  it("rejects range longer than max days", () => {
    expect(
      patchSkuSliceByDateSchema.safeParse({
        ...validRange,
        dateFrom: "2025-01-01",
        dateTo: "2026-01-02",
      }).success
    ).toBe(false);
    expect(MAX_PATCH_RANGE_DAYS).toBe(366);
  });
});
