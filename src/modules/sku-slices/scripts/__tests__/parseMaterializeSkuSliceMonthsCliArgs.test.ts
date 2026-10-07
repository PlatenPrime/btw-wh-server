import { describe, expect, it } from "vitest";
import { parseMaterializeSkuSliceMonthsCliArgs } from "../parseMaterializeSkuSliceMonthsCliArgs.js";

describe("parseMaterializeSkuSliceMonthsCliArgs", () => {
  it("defaults to dry-run with daysBack 30", () => {
    expect(parseMaterializeSkuSliceMonthsCliArgs([])).toEqual({
      daysBack: 30,
      apply: false,
    });
  });

  it("parses days-back/as-of/apply/konk", () => {
    expect(
      parseMaterializeSkuSliceMonthsCliArgs([
        "--days-back",
        "7",
        "--as-of",
        "2026-10-07",
        "--apply",
        "--konk",
        "air",
      ]),
    ).toEqual({
      daysBack: 7,
      asOf: new Date("2026-10-07T00:00:00.000Z"),
      apply: true,
      konkName: "air",
    });
  });

  it("rejects invalid ints, dates and unknown flags", () => {
    expect(() => parseMaterializeSkuSliceMonthsCliArgs(["--wat"])).toThrow(
      /Unknown/,
    );
    expect(() =>
      parseMaterializeSkuSliceMonthsCliArgs(["--days-back", "0"]),
    ).toThrow(/integer >= 1/);
    expect(() =>
      parseMaterializeSkuSliceMonthsCliArgs(["--days-back", "1.5"]),
    ).toThrow(/integer >= 1/);
    expect(() =>
      parseMaterializeSkuSliceMonthsCliArgs(["--as-of", "07.10.2026"]),
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      parseMaterializeSkuSliceMonthsCliArgs(["--apply", "--as-of"]),
    ).toThrow(/--as-of requires a value/);
    expect(() =>
      parseMaterializeSkuSliceMonthsCliArgs(["--konk", ""]),
    ).toThrow(/--konk requires/);
  });
});
