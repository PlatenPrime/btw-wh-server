import { describe, expect, it } from "vitest";
import { parseBackfillBtradeManufacturerSalesCliArgs } from "../parseBackfillBtradeManufacturerSalesCliArgs.js";

describe("parseBackfillBtradeManufacturerSalesCliArgs", () => {
  it("parses from/to/apply", () => {
    const r = parseBackfillBtradeManufacturerSalesCliArgs([
      "--from",
      "2026-01-01",
      "--to",
      "2026-01-31",
      "--apply",
    ]);
    expect(r.apply).toBe(true);
    expect(r.from.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(r.to.toISOString().slice(0, 10)).toBe("2026-01-31");
  });

  it("rejects missing range", () => {
    expect(() =>
      parseBackfillBtradeManufacturerSalesCliArgs(["--apply"]),
    ).toThrow(/--from and --to/);
  });
});
