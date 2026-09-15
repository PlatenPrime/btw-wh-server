import { describe, expect, it } from "vitest";
import { parsePerfectPackFlipCliArgs } from "../parsePerfectPackFlipCliArgs.js";

describe("parsePerfectPackFlipCliArgs", () => {
  it("defaults to dry-run without dates", () => {
    expect(parsePerfectPackFlipCliArgs([])).toEqual({ apply: false });
  });

  it("parses from/to/apply/konk", () => {
    expect(
      parsePerfectPackFlipCliArgs([
        "--from",
        "2026-09-11",
        "--to",
        "2026-09-15",
        "--apply",
        "--konk",
        "perfect",
      ])
    ).toEqual({
      from: new Date("2026-09-11T00:00:00.000Z"),
      to: new Date("2026-09-15T00:00:00.000Z"),
      apply: true,
      konkName: "perfect",
    });
  });

  it("rejects a single bound and inverted range", () => {
    expect(() => parsePerfectPackFlipCliArgs(["--from", "2026-09-11"])).toThrow(
      /both --from and --to/
    );
    expect(() =>
      parsePerfectPackFlipCliArgs([
        "--from",
        "2026-09-15",
        "--to",
        "2026-09-11",
      ])
    ).toThrow(/from must be <= --to/);
  });

  it("rejects unknown flags and bad dates", () => {
    expect(() => parsePerfectPackFlipCliArgs(["--wat"])).toThrow(/Unknown/);
    expect(() => parsePerfectPackFlipCliArgs(["--from", "15.09"])).toThrow(
      /YYYY-MM-DD/
    );
    expect(() => parsePerfectPackFlipCliArgs(["--apply", "--to"])).toThrow(
      /--to requires a value/
    );
    expect(() => parsePerfectPackFlipCliArgs(["--konk", "   "])).toThrow(
      /--konk requires a name/
    );
  });
});
