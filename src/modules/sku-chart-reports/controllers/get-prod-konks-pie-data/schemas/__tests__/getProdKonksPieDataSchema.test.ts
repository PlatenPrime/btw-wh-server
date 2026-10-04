import { describe, expect, it } from "vitest";
import { getProdKonksPieDataSchema } from "../getProdKonksPieDataSchema.js";

describe("getProdKonksPieDataSchema", () => {
  it("parses prod and date range", () => {
    const result = getProdKonksPieDataSchema.safeParse({
      prod: "Acme",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing prod", () => {
    const result = getProdKonksPieDataSchema.safeParse({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(false);
  });

  it("rejects inverted date range", () => {
    const result = getProdKonksPieDataSchema.safeParse({
      prod: "Acme",
      dateFrom: "2026-06-10",
      dateTo: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });
});
