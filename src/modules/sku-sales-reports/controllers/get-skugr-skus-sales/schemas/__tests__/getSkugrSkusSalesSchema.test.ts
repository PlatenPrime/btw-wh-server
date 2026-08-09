import { describe, expect, it } from "vitest";
import { getSkugrSkusSalesSchema } from "../getSkugrSkusSalesSchema.js";

const VALID_SKUGR_ID = "507f1f77bcf86cd799439011";

describe("getSkugrSkusSalesSchema", () => {
  it("parses valid skugr skus-sales range", () => {
    const result = getSkugrSkusSalesSchema.safeParse({
      skugrId: VALID_SKUGR_ID,
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid skugrId", () => {
    const result = getSkugrSkusSalesSchema.safeParse({
      skugrId: "nope",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(false);
  });

  it("rejects dateFrom after dateTo", () => {
    const result = getSkugrSkusSalesSchema.safeParse({
      skugrId: VALID_SKUGR_ID,
      dateFrom: "2026-06-10",
      dateTo: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });
});
