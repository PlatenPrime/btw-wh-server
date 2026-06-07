import { describe, expect, it } from "vitest";
import { enumerateSliceDates } from "../enumerateSliceDates.js";

describe("enumerateSliceDates", () => {
  it("returns single date when from equals to", () => {
    const d = new Date("2026-03-01T00:00:00.000Z");
    expect(enumerateSliceDates(d, d)).toEqual([d]);
  });

  it("enumerates consecutive UTC days inclusive", () => {
    const from = new Date("2026-03-01T00:00:00.000Z");
    const to = new Date("2026-03-03T00:00:00.000Z");
    const result = enumerateSliceDates(from, to);

    expect(result).toHaveLength(3);
    expect(result[0]?.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(result[1]?.toISOString()).toBe("2026-03-02T00:00:00.000Z");
    expect(result[2]?.toISOString()).toBe("2026-03-03T00:00:00.000Z");
  });

  it("returns empty array when from is after to", () => {
    const from = new Date("2026-03-05T00:00:00.000Z");
    const to = new Date("2026-03-01T00:00:00.000Z");
    expect(enumerateSliceDates(from, to)).toEqual([]);
  });
});
