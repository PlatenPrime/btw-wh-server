import { describe, expect, it } from "vitest";
import {
  discoverBandSpikeSchema,
  MAX_DISCOVER_BAND_SPIKE_RANGE_DAYS,
} from "../discoverBandSpikeSchema.js";

describe("discoverBandSpikeSchema", () => {
  it("parses valid body and normalizes konkName", () => {
    const result = discoverBandSpikeSchema.safeParse({
      konkName: " SvBuM ",
      stockMin: 900000,
      stockMax: 9999999,
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.konkName).toBe("svbum");
    expect(result.data.stockMin).toBe(900000);
  });

  it("rejects stockMin > stockMax", () => {
    const result = discoverBandSpikeSchema.safeParse({
      konkName: "balun",
      stockMin: 11000,
      stockMax: 9000,
      dateFrom: "2026-09-01",
      dateTo: "2026-09-02",
    });
    expect(result.success).toBe(false);
  });

  it("rejects range longer than max days", () => {
    const result = discoverBandSpikeSchema.safeParse({
      konkName: "balun",
      stockMin: 9000,
      stockMax: 11000,
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
    });
    expect(result.success).toBe(false);
    expect(MAX_DISCOVER_BAND_SPIKE_RANGE_DAYS).toBe(93);
  });

  it("rejects unknown keys", () => {
    const result = discoverBandSpikeSchema.safeParse({
      konkName: "balun",
      stockMin: 9000,
      stockMax: 11000,
      dateFrom: "2026-09-01",
      dateTo: "2026-09-02",
      apply: true,
    });
    expect(result.success).toBe(false);
  });
});
