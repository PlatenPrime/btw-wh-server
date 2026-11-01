import { describe, expect, it } from "vitest";
import { rescaleDojdevikMonthDays } from "../rescaleDojdevikMonthDays.js";

describe("rescaleDojdevikMonthDays", () => {
  it("rescales finite days and skips -1", () => {
    const result = rescaleDojdevikMonthDays(
      {
        "2026-10-01": { stock: 6300, price: 0.58 },
        "2026-10-02": { stock: -1, price: -1 },
      },
      100,
      6,
    );
    expect(result.days["2026-10-01"]).toEqual({ stock: 378, price: 9.67 });
    expect(result.days["2026-10-02"]).toEqual({ stock: -1, price: -1 });
    expect(result.changedDayKeys).toEqual(["2026-10-01"]);
  });

  it("returns empty when no days", () => {
    expect(rescaleDojdevikMonthDays(undefined, 100, 6)).toEqual({
      days: {},
      changedDayKeys: [],
    });
  });
});
