import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import {
  correctBandSpikeSchema,
  MAX_CORRECT_BAND_SPIKE_RANGE_DAYS,
} from "../correctBandSpikeSchema.js";

const skuId = new mongoose.Types.ObjectId().toString();

describe("correctBandSpikeSchema", () => {
  it("parses valid body with apply default false", () => {
    const result = correctBandSpikeSchema.safeParse({
      skuId,
      dateFrom: "2026-09-14",
      dateTo: "2026-09-16",
      stockMin: 9000,
      stockMax: 11000,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.apply).toBe(false);
    expect(result.data.stockMin).toBe(9000);
  });

  it("rejects invalid skuId", () => {
    const result = correctBandSpikeSchema.safeParse({
      skuId: "nope",
      dateFrom: "2026-09-14",
      dateTo: "2026-09-16",
      stockMin: 9000,
      stockMax: 11000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects stockMin > stockMax", () => {
    const result = correctBandSpikeSchema.safeParse({
      skuId,
      dateFrom: "2026-09-14",
      dateTo: "2026-09-16",
      stockMin: 11000,
      stockMax: 9000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects range longer than max days", () => {
    const result = correctBandSpikeSchema.safeParse({
      skuId,
      dateFrom: "2025-01-01",
      dateTo: "2027-01-01",
      stockMin: 9000,
      stockMax: 11000,
    });
    expect(result.success).toBe(false);
    expect(MAX_CORRECT_BAND_SPIKE_RANGE_DAYS).toBe(366);
  });
});
