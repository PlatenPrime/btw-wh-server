import { describe, expect, it } from "vitest";
import { parseMigrateAllSkuSlicesToMonthsCliArgs } from "../parseMigrateAllSkuSlicesToMonthsCliArgs.js";

describe("parseMigrateAllSkuSlicesToMonthsCliArgs", () => {
  it("defaults to dry-run with verify", () => {
    expect(parseMigrateAllSkuSlicesToMonthsCliArgs([])).toEqual({
      apply: false,
      verify: true,
      verifySample: 100,
    });
  });

  it("parses apply, konk, verify-sample, no-verify", () => {
    expect(
      parseMigrateAllSkuSlicesToMonthsCliArgs([
        "--apply",
        "--konk",
        "air",
        "--verify-sample",
        "50",
      ]),
    ).toEqual({
      apply: true,
      verify: true,
      verifySample: 50,
      konkName: "air",
    });

    expect(
      parseMigrateAllSkuSlicesToMonthsCliArgs(["--apply", "--no-verify"]),
    ).toEqual({
      apply: true,
      verify: false,
      verifySample: 100,
    });
  });

  it("rejects bad args", () => {
    expect(() => parseMigrateAllSkuSlicesToMonthsCliArgs(["--wat"])).toThrow();
    expect(() =>
      parseMigrateAllSkuSlicesToMonthsCliArgs(["--verify-sample", "0"]),
    ).toThrow();
    expect(() =>
      parseMigrateAllSkuSlicesToMonthsCliArgs(["--konk", ""]),
    ).toThrow();
  });
});
