import { describe, expect, it } from "vitest";
import {
  getGroupPagesPageDelayMs,
  resolveInterUnitDelayMs,
  resolveScrapeRequestJitter,
  shouldApplyInterUnitClusterPause,
} from "../competitorScrapeThrottle.js";

describe("competitorScrapeThrottle", () => {
  it("resolves default sku slice jitter for unknown konk", () => {
    expect(resolveScrapeRequestJitter("balun", "skuSlice")).toEqual({
      minMs: 500,
      maxMs: 1500,
    });
  });

  it("resolves air sku slice jitter", () => {
    expect(resolveScrapeRequestJitter("air", "skuSlice")).toEqual({
      minMs: 2000,
      maxMs: 5000,
    });
  });

  it("resolves air group page jitter slower than default", () => {
    const air = resolveScrapeRequestJitter("air", "groupPagesPage");
    const def = resolveScrapeRequestJitter("balun", "groupPagesPage");
    expect(air.minMs).toBeGreaterThan(def.minMs);
    expect(air.maxMs).toBeGreaterThan(def.maxMs);
  });

  it("getGroupPagesPageDelayMs returns value in range", () => {
    const ms = getGroupPagesPageDelayMs("air");
    expect(ms).toBeGreaterThanOrEqual(2000);
    expect(ms).toBeLessThanOrEqual(4000);
  });

  it("air groupPagesFill has inter-unit delay", () => {
    const ms = resolveInterUnitDelayMs("air", "groupPagesFill");
    expect(ms).toBeGreaterThanOrEqual(45_000);
    expect(ms).toBeLessThanOrEqual(90_000);
  });

  it("shouldApplyInterUnitClusterPause every 5 air groups", () => {
    const cluster = shouldApplyInterUnitClusterPause({
      konkName: "air",
      completedUnits: 5,
      isLast: false,
    });
    expect(cluster).toBe(true);
    expect(
      shouldApplyInterUnitClusterPause({
        konkName: "air",
        completedUnits: 4,
        isLast: false,
      })
    ).toBe(false);
  });
});
