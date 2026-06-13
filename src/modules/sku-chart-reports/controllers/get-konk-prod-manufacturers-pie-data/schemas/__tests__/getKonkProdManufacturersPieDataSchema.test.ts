import { describe, expect, it } from "vitest";
import { getKonkProdManufacturersPieDataSchema } from "../getKonkProdManufacturersPieDataSchema.js";

describe("getKonkProdManufacturersPieDataSchema", () => {
  it("parses konk and date range without prod", () => {
    const result = getKonkProdManufacturersPieDataSchema.safeParse({
      konk: "air",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing konk", () => {
    const result = getKonkProdManufacturersPieDataSchema.safeParse({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(false);
  });

  it("rejects inverted date range", () => {
    const result = getKonkProdManufacturersPieDataSchema.safeParse({
      konk: "air",
      dateFrom: "2026-06-10",
      dateTo: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });
});
