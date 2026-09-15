import { describe, expect, it } from "vitest";
import { getPackFlipReviewSchema } from "../getPackFlipReviewSchema.js";

describe("getPackFlipReviewSchema", () => {
  it("parses valid range and normalizes konkName", () => {
    const result = getPackFlipReviewSchema.safeParse({
      konkName: " Perfect ",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-15",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.konkName).toBe("perfect");
    expect(result.data.dateFrom.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(result.data.dateTo.toISOString()).toBe("2026-09-15T00:00:00.000Z");
  });

  it("rejects missing konkName", () => {
    const result = getPackFlipReviewSchema.safeParse({
      dateFrom: "2026-09-01",
      dateTo: "2026-09-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects inverted range", () => {
    const result = getPackFlipReviewSchema.safeParse({
      konkName: "perfect",
      dateFrom: "2026-09-15",
      dateTo: "2026-09-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects blank konkName after normalize", () => {
    const result = getPackFlipReviewSchema.safeParse({
      konkName: "   ",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = getPackFlipReviewSchema.safeParse({
      konkName: "perfect",
      dateFrom: "15.09.2026",
      dateTo: "2026-09-15",
    });
    expect(result.success).toBe(false);
  });
});
