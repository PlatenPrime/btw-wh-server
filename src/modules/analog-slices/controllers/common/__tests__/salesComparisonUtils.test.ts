import { describe, expect, it } from "vitest";
import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../salesComparisonUtils.js";

describe("salesComparisonUtils", () => {
  describe("computeSalesFromStockSequence", () => {
    it("returns sales 0 and not delivery for first day when no previous", () => {
      const result = computeSalesFromStockSequence([1000]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ sales: 0, isDeliveryDay: false });
    });

    it("computes sales as prev - curr when stock decreases", () => {
      const result = computeSalesFromStockSequence([1000, 800, 500]);
      expect(result[0]).toEqual({ sales: 0, isDeliveryDay: false });
      expect(result[1]).toEqual({ sales: 200, isDeliveryDay: false });
      expect(result[2]).toEqual({ sales: 300, isDeliveryDay: false });
    });

    it("returns sales 0 and isDeliveryDay true when stock increases", () => {
      const result = computeSalesFromStockSequence([800, 1000]);
      expect(result[0]).toEqual({ sales: 0, isDeliveryDay: false });
      expect(result[1]).toEqual({ sales: 0, isDeliveryDay: true });
    });

    it("handles null stock as no previous: sales 0", () => {
      const result = computeSalesFromStockSequence([null, 500]);
      expect(result[0]).toEqual({ sales: 0, isDeliveryDay: false });
      expect(result[1]).toEqual({ sales: 0, isDeliveryDay: false });
    });

    it("handles null current: sales 0", () => {
      const result = computeSalesFromStockSequence([1000, null]);
      expect(result[1]).toEqual({ sales: 0, isDeliveryDay: false });
    });

    it("empty array returns empty result", () => {
      const result = computeSalesFromStockSequence([]);
      expect(result).toEqual([]);
    });

    it("mixed: decrease then delivery day then decrease", () => {
      const result = computeSalesFromStockSequence([1000, 800, 1200, 900]);
      expect(result[0]).toEqual({ sales: 0, isDeliveryDay: false });
      expect(result[1]).toEqual({ sales: 200, isDeliveryDay: false });
      expect(result[2]).toEqual({ sales: 0, isDeliveryDay: true });
      expect(result[3]).toEqual({ sales: 300, isDeliveryDay: false });
    });
  });

  describe("computeRevenueForDay", () => {
    it("returns sales * price when both finite", () => {
      expect(computeRevenueForDay(200, 2)).toBe(400);
      expect(computeRevenueForDay(100, 10.5)).toBe(1050);
    });

    it("rounds to 2 decimals to avoid float precision issues", () => {
      expect(computeRevenueForDay(300, 1.64)).toBe(492);
    });

    it("returns 0 when price is null", () => {
      expect(computeRevenueForDay(200, null)).toBe(0);
    });

    it("returns 0 when sales is 0", () => {
      expect(computeRevenueForDay(0, 5)).toBe(0);
    });
  });
});
