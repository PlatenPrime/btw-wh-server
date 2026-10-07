import { describe, expect, it } from "vitest";
import { SVBUM_FAKE_STOCK_CRON_DAYS_BACK } from "../../../slices/config/svbumFakeStockThreshold.js";
import { parseCorrectSvbumFakeStockCliArgs } from "../parseCorrectSvbumFakeStockCliArgs.js";

describe("parseCorrectSvbumFakeStockCliArgs", () => {
  it("defaults to dry-run with cron daysBack", () => {
    expect(parseCorrectSvbumFakeStockCliArgs([])).toEqual({
      daysBack: SVBUM_FAKE_STOCK_CRON_DAYS_BACK,
      apply: false,
    });
  });

  it("parses days-back/as-of/apply/lookback-days", () => {
    expect(
      parseCorrectSvbumFakeStockCliArgs([
        "--days-back",
        "7",
        "--as-of",
        "2026-10-07",
        "--apply",
        "--lookback-days",
        "30",
      ])
    ).toEqual({
      daysBack: 7,
      asOf: new Date("2026-10-07T00:00:00.000Z"),
      apply: true,
      lookbackDays: 30,
    });
  });

  it("allows lookback-days 0", () => {
    expect(
      parseCorrectSvbumFakeStockCliArgs(["--lookback-days", "0"])
    ).toEqual({
      daysBack: SVBUM_FAKE_STOCK_CRON_DAYS_BACK,
      apply: false,
      lookbackDays: 0,
    });
  });

  it("rejects invalid ints, dates and unknown flags", () => {
    expect(() => parseCorrectSvbumFakeStockCliArgs(["--wat"])).toThrow(
      /Unknown/
    );
    expect(() =>
      parseCorrectSvbumFakeStockCliArgs(["--days-back", "0"])
    ).toThrow(/integer >= 1/);
    expect(() =>
      parseCorrectSvbumFakeStockCliArgs(["--days-back", "1.5"])
    ).toThrow(/integer >= 1/);
    expect(() =>
      parseCorrectSvbumFakeStockCliArgs(["--lookback-days", "-1"])
    ).toThrow(/integer >= 0/);
    expect(() =>
      parseCorrectSvbumFakeStockCliArgs(["--as-of", "07.10.2026"])
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      parseCorrectSvbumFakeStockCliArgs(["--apply", "--as-of"])
    ).toThrow(/--as-of requires a value/);
  });
});
