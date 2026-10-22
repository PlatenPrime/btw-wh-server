import { describe, expect, it } from "vitest";
import {
  MAX_CORRECT_RANGE_DAYS,
  correctBalunBandSpikeSchema,
} from "../correctBalunBandSpikeSchema.js";

const VALID_SKU_ID = "507f1f77bcf86cd799439011";

describe("correctBalunBandSpikeSchema", () => {
  const valid = {
    skuId: VALID_SKU_ID,
    dateFrom: "2026-10-16",
    dateTo: "2026-10-19",
  };

  it("parses valid payload and defaults apply to false", () => {
    const result = correctBalunBandSpikeSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apply).toBe(false);
      expect(result.data.dateFrom.toISOString()).toBe("2026-10-16T00:00:00.000Z");
      expect(result.data.dateTo.toISOString()).toBe("2026-10-19T00:00:00.000Z");
    }
  });

  it("accepts apply true", () => {
    const result = correctBalunBandSpikeSchema.safeParse({ ...valid, apply: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.apply).toBe(true);
  });

  it("rejects invalid skuId", () => {
    expect(correctBalunBandSpikeSchema.safeParse({ ...valid, skuId: "bad" }).success).toBe(false);
  });

  it("rejects dateFrom after dateTo", () => {
    const result = correctBalunBandSpikeSchema.safeParse({
      ...valid,
      dateFrom: "2026-10-20",
      dateTo: "2026-10-19",
    });
    expect(result.success).toBe(false);
  });

  it(`rejects range longer than ${MAX_CORRECT_RANGE_DAYS} days`, () => {
    const result = correctBalunBandSpikeSchema.safeParse({
      ...valid,
      dateFrom: "2025-01-01",
      dateTo: "2026-12-31",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(correctBalunBandSpikeSchema.safeParse({ ...valid, extra: 1 }).success).toBe(false);
  });
});
