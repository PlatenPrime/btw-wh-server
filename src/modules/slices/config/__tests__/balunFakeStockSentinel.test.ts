import { describe, expect, it } from "vitest";
import {
  BALUN_FAKE_STOCK_KONK_NAME,
  BALUN_FAKE_STOCK_LOOKBACK_DAYS,
  BALUN_FAKE_STOCK_MAX,
  BALUN_FAKE_STOCK_MIN,
  BALUN_FAKE_STOCK_SPIKE_MAX,
  BALUN_FAKE_STOCK_SPIKE_MIN,
} from "../balunFakeStockSentinel.js";

describe("balunFakeStockSentinel", () => {
  it("exposes inclusive spike and clamp ranges, lookback and konk name", () => {
    expect(BALUN_FAKE_STOCK_SPIKE_MIN).toBe(4990);
    expect(BALUN_FAKE_STOCK_SPIKE_MAX).toBe(5000);
    expect(BALUN_FAKE_STOCK_MIN).toBe(9950);
    expect(BALUN_FAKE_STOCK_MAX).toBe(10000);
    expect(BALUN_FAKE_STOCK_LOOKBACK_DAYS).toBe(90);
    expect(BALUN_FAKE_STOCK_KONK_NAME).toBe("balun");
  });
});
