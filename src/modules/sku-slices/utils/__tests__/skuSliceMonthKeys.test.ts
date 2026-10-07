import { describe, expect, it } from "vitest";
import {
  toSliceMonthDate,
  toSliceMonthDayKey,
} from "../skuSliceMonthKeys.js";

describe("skuSliceMonthKeys", () => {
  it("toSliceMonthDate normalizes to UTC midnight of the 1st", () => {
    expect(toSliceMonthDate(new Date("2026-10-07T15:30:00.000Z"))).toEqual(
      new Date("2026-10-01T00:00:00.000Z"),
    );
    expect(toSliceMonthDate(new Date("2026-09-08T00:00:00.000Z"))).toEqual(
      new Date("2026-09-01T00:00:00.000Z"),
    );
  });

  it("toSliceMonthDayKey returns YYYY-MM-DD", () => {
    expect(toSliceMonthDayKey(new Date("2026-10-07T12:00:00.000Z"))).toBe(
      "2026-10-07",
    );
  });
});
