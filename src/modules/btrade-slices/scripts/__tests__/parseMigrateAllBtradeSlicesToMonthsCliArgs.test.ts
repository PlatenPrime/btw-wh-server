import { describe, expect, it } from "vitest";
import { parseMigrateAllBtradeSlicesToMonthsCliArgs } from "../parseMigrateAllBtradeSlicesToMonthsCliArgs.js";

describe("parseMigrateAllBtradeSlicesToMonthsCliArgs", () => {
  it("defaults to dry-run with verify", () => {
    expect(parseMigrateAllBtradeSlicesToMonthsCliArgs([])).toEqual({
      apply: false,
      verify: true,
      verifySample: 100,
    });
  });

  it("parses apply, verify-sample, no-verify", () => {
    expect(
      parseMigrateAllBtradeSlicesToMonthsCliArgs([
        "--apply",
        "--verify-sample",
        "50",
      ]),
    ).toEqual({
      apply: true,
      verify: true,
      verifySample: 50,
    });

    expect(
      parseMigrateAllBtradeSlicesToMonthsCliArgs(["--apply", "--no-verify"]),
    ).toEqual({
      apply: true,
      verify: false,
      verifySample: 100,
    });
  });

  it("rejects bad args", () => {
    expect(() =>
      parseMigrateAllBtradeSlicesToMonthsCliArgs(["--wat"]),
    ).toThrow();
    expect(() =>
      parseMigrateAllBtradeSlicesToMonthsCliArgs(["--verify-sample", "0"]),
    ).toThrow();
  });
});
