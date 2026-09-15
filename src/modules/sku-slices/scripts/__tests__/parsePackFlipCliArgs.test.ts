import { describe, expect, it } from "vitest";
import { parsePackFlipCliArgs } from "../parsePackFlipCliArgs.js";

describe("parsePackFlipCliArgs", () => {
  it("defaults to dry-run without dates", () => {
    expect(parsePackFlipCliArgs([])).toEqual({ apply: false });
  });

  it("parses from/to/apply/konk", () => {
    expect(
      parsePackFlipCliArgs([
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

  it("normalizes --konk", () => {
    expect(parsePackFlipCliArgs(["--konk", " Air "])).toEqual({
      apply: false,
      konkName: "air",
    });
  });

  it("rejects a single bound and inverted range", () => {
    expect(() => parsePackFlipCliArgs(["--from", "2026-09-11"])).toThrow(
      /both --from and --to/
    );
    expect(() =>
      parsePackFlipCliArgs([
        "--from",
        "2026-09-15",
        "--to",
        "2026-09-11",
      ])
    ).toThrow(/from must be <= --to/);
  });

  it("rejects unknown flags and bad dates", () => {
    expect(() => parsePackFlipCliArgs(["--wat"])).toThrow(/Unknown/);
    expect(() => parsePackFlipCliArgs(["--from", "15.09"])).toThrow(
      /YYYY-MM-DD/
    );
    expect(() => parsePackFlipCliArgs(["--apply", "--to"])).toThrow(
      /--to requires a value/
    );
    expect(() => parsePackFlipCliArgs(["--konk", "   "])).toThrow(
      /--konk requires a name/
    );
  });
});
