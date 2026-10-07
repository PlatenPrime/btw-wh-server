import { describe, expect, it } from "vitest";
import {
  SVBUM_FAKE_STOCK_CRON_DAYS_BACK,
  SVBUM_FAKE_STOCK_KONK_NAME,
  SVBUM_FAKE_STOCK_LOOKBACK_DAYS,
  SVBUM_FAKE_STOCK_THRESHOLD,
  SVBUM_FAKE_STOCK_TRAILING_GRACE_DAYS,
} from "../svbumFakeStockThreshold.js";

describe("svbumFakeStockThreshold", () => {
  it("exposes threshold, grace, lookback and konk name", () => {
    expect(SVBUM_FAKE_STOCK_THRESHOLD).toBe(900_000);
    expect(SVBUM_FAKE_STOCK_TRAILING_GRACE_DAYS).toBe(1);
    expect(SVBUM_FAKE_STOCK_LOOKBACK_DAYS).toBe(90);
    expect(SVBUM_FAKE_STOCK_CRON_DAYS_BACK).toBe(14);
    expect(SVBUM_FAKE_STOCK_KONK_NAME).toBe("svbum");
  });
});
