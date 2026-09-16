import { describe, expect, it } from "vitest";
import { runExcelJobKind } from "../runExcelJobKind.js";

describe("runExcelJobKind", () => {
  it("returns validation error for bad params", async () => {
    const result = await runExcelJobKind("sku-one-sales", {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Validation error");
    }
  });

  it("returns not found for missing sku", async () => {
    const result = await runExcelJobKind("sku-one-sales", {
      skuId: "64b0c0c0c0c0c0c0c0c0c0c0",
      dateFrom: "2026-01-01",
      dateTo: "2026-01-02",
    });
    expect(result.ok).toBe(false);
  });
});
