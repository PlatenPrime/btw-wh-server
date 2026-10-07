import { describe, expect, it } from "vitest";
import {
  POST_CORRECTIONS_MAX_RANGE_DAYS,
  postSkuSlicePostCorrectionsSchema,
} from "../postSkuSlicePostCorrectionsSchema.js";

describe("postSkuSlicePostCorrectionsSchema", () => {
  it("defaults apply to false", () => {
    const parsed = postSkuSlicePostCorrectionsSchema.safeParse({
      dateFrom: "2026-04-01",
      dateTo: "2026-04-03",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.apply).toBe(false);
    }
  });

  it("rejects inverted range and ranges over max days", () => {
    expect(
      postSkuSlicePostCorrectionsSchema.safeParse({
        dateFrom: "2026-04-05",
        dateTo: "2026-04-01",
      }).success
    ).toBe(false);

    const from = "2026-04-01";
    const to = "2026-05-02";
    expect(POST_CORRECTIONS_MAX_RANGE_DAYS).toBe(31);
    expect(
      postSkuSlicePostCorrectionsSchema.safeParse({
        dateFrom: from,
        dateTo: to,
      }).success
    ).toBe(false);
  });
});
