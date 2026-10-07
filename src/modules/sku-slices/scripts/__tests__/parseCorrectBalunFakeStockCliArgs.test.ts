import { describe, expect, it } from "vitest";
import { BALUN_FAKE_STOCK_CRON_DAYS_BACK } from "../../../slices/config/balunFakeStockSentinel.js";
import { parseCorrectBalunFakeStockCliArgs } from "../parseCorrectBalunFakeStockCliArgs.js";

describe("parseCorrectBalunFakeStockCliArgs", () => {
  it("defaults to dry-run with cron daysBack", () => {
    expect(parseCorrectBalunFakeStockCliArgs([])).toEqual({
      daysBack: BALUN_FAKE_STOCK_CRON_DAYS_BACK,
      apply: false,
    });
  });

  it("parses days-back/as-of/apply/lookback-days", () => {
    expect(
      parseCorrectBalunFakeStockCliArgs([
        "--days-back",
        "14",
        "--as-of",
        "2026-10-07",
        "--apply",
        "--lookback-days",
        "30",
      ])
    ).toEqual({
      daysBack: 14,
      asOf: new Date("2026-10-07T00:00:00.000Z"),
      apply: true,
      lookbackDays: 30,
    });
  });

  it("allows lookback-days 0", () => {
    expect(
      parseCorrectBalunFakeStockCliArgs(["--lookback-days", "0"])
    ).toEqual({
      daysBack: BALUN_FAKE_STOCK_CRON_DAYS_BACK,
      apply: false,
      lookbackDays: 0,
    });
  });

  it("rejects invalid ints, dates and unknown flags", () => {
    expect(() => parseCorrectBalunFakeStockCliArgs(["--wat"])).toThrow(
      /Unknown/
    );
    expect(() =>
      parseCorrectBalunFakeStockCliArgs(["--days-back", "0"])
    ).toThrow(/integer >= 1/);
    expect(() =>
      parseCorrectBalunFakeStockCliArgs(["--days-back", "1.5"])
    ).toThrow(/integer >= 1/);
    expect(() =>
      parseCorrectBalunFakeStockCliArgs(["--lookback-days", "-1"])
    ).toThrow(/integer >= 0/);
    expect(() =>
      parseCorrectBalunFakeStockCliArgs(["--as-of", "07.10.2026"])
    ).toThrow(/YYYY-MM-DD/);
    expect(() => parseCorrectBalunFakeStockCliArgs(["--apply", "--as-of"])).toThrow(
      /--as-of requires a value/
    );
  });
});
