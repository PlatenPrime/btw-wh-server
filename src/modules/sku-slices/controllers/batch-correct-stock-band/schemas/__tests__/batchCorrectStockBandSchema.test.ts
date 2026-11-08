import { describe, expect, it } from "vitest";
import { batchCorrectStockBandSchema } from "../batchCorrectStockBandSchema.js";

describe("batchCorrectStockBandSchema", () => {
  it("accepts valid payload", () => {
    const parsed = batchCorrectStockBandSchema.safeParse({
      bandId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-08",
      productIds: ["balun-1", "balun-2"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty productIds", () => {
    const parsed = batchCorrectStockBandSchema.safeParse({
      bandId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-08",
      productIds: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate productIds", () => {
    const parsed = batchCorrectStockBandSchema.safeParse({
      bandId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-08",
      productIds: ["balun-1", "balun-1"],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts Date params from Mongo", () => {
    const parsed = batchCorrectStockBandSchema.safeParse({
      bandId: "507f1f77bcf86cd799439011",
      dateFrom: new Date("2026-10-26T00:00:00.000Z"),
      dateTo: new Date("2026-11-08T00:00:00.000Z"),
      productIds: ["balun-1"],
    });
    expect(parsed.success).toBe(true);
  });
});
