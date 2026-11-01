import { describe, expect, it } from "vitest";
import { parseRescaleDojdevikPackCliArgs } from "../parseRescaleDojdevikPackCliArgs.js";

describe("parseRescaleDojdevikPackCliArgs", () => {
  it("defaults to dry-run", () => {
    expect(parseRescaleDojdevikPackCliArgs([])).toEqual({ apply: false });
  });

  it("parses apply limit productId jitter range", () => {
    expect(
      parseRescaleDojdevikPackCliArgs([
        "--apply",
        "--limit",
        "10",
        "--productId",
        "dojdevik-1",
        "--jitter-min-ms",
        "800",
        "--jitter-max-ms",
        "2500",
      ]),
    ).toEqual({
      apply: true,
      limit: 10,
      productId: "dojdevik-1",
      jitterMinMs: 800,
      jitterMaxMs: 2500,
    });
  });

  it("rejects unknown and bad values", () => {
    expect(() => parseRescaleDojdevikPackCliArgs(["--wat"])).toThrow(/Unknown/);
    expect(() => parseRescaleDojdevikPackCliArgs(["--limit", "0"])).toThrow(/positive integer/);
    expect(() => parseRescaleDojdevikPackCliArgs(["--limit"])).toThrow(/requires a value/);
    expect(() => parseRescaleDojdevikPackCliArgs(["--productId", "  "])).toThrow(
      /requires a value/,
    );
    expect(() => parseRescaleDojdevikPackCliArgs(["--jitter-min-ms", "100"])).toThrow(
      /both --jitter-min-ms and --jitter-max-ms/,
    );
    expect(() =>
      parseRescaleDojdevikPackCliArgs(["--jitter-min-ms", "500", "--jitter-max-ms", "100"]),
    ).toThrow(/jitter-min-ms must be <=/);
  });
});
