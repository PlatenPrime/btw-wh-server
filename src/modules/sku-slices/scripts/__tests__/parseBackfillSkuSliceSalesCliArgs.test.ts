import { describe, expect, it } from "vitest";
import { parseBackfillSkuSliceSalesCliArgs } from "../parseBackfillSkuSliceSalesCliArgs.js";

describe("parseBackfillSkuSliceSalesCliArgs", () => {
  it("parses from/to/apply/konk/productId", () => {
    const r = parseBackfillSkuSliceSalesCliArgs([
      "--from",
      "2026-01-01",
      "--to",
      "2026-01-31",
      "--apply",
      "--konk",
      "Air",
      "--productId",
      "p-1",
    ]);
    expect(r.apply).toBe(true);
    expect(r.konkName).toBe("air");
    expect(r.productId).toBe("p-1");
    expect(r.from.toISOString().startsWith("2026-01-01")).toBe(true);
    expect(r.to.toISOString().startsWith("2026-01-31")).toBe(true);
  });

  it("defaults apply to false", () => {
    const r = parseBackfillSkuSliceSalesCliArgs([
      "--from",
      "2026-01-01",
      "--to",
      "2026-01-02",
    ]);
    expect(r.apply).toBe(false);
  });

  it("requires from and to", () => {
    expect(() => parseBackfillSkuSliceSalesCliArgs([])).toThrow(/--from/);
  });
});
