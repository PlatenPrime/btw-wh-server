import { describe, expect, it } from "vitest";
import { toNextKyivSliceDate, toOpenKyivSliceDate, toSliceDate } from "../sliceDate.js";

describe("toSliceDate", () => {
  it("maps instant to UTC midnight of the same calendar day in Europe/Kiev", () => {
    const d = new Date("2025-03-01T15:30:00.000Z");
    expect(toSliceDate(d).toISOString()).toBe("2025-03-01T00:00:00.000Z");
  });

  it("at Kyiv midnight the key is the new Kyiv day (not previous UTC day)", () => {
    const kyivMidnightUtc = new Date("2025-01-15T22:00:00.000Z");
    expect(toSliceDate(kyivMidnightUtc).toISOString()).toBe("2025-01-16T00:00:00.000Z");
  });
});

describe("toNextKyivSliceDate", () => {
  it("evening Kyiv maps to next calendar slice day (EEST +3: 02 Apr 20:00 → 03 Apr key)", () => {
    const d = new Date("2026-04-02T17:00:00.000Z");
    expect(toNextKyivSliceDate(d).toISOString()).toBe("2026-04-03T00:00:00.000Z");
  });

  it("rolls month boundary in Kyiv calendar", () => {
    const d = new Date("2026-01-31T12:00:00.000Z");
    expect(toNextKyivSliceDate(d).toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });
});

describe("toOpenKyivSliceDate", () => {
  it("keeps the same Kyiv day before 20:00 EEST and rolls at 20:00", () => {
    const before = new Date("2026-07-26T16:59:00.000Z");
    const atOpen = new Date("2026-07-26T17:00:00.000Z");
    expect(toOpenKyivSliceDate(before).toISOString()).toBe("2026-07-26T00:00:00.000Z");
    expect(toOpenKyivSliceDate(atOpen).toISOString()).toBe("2026-07-27T00:00:00.000Z");
  });

  it("keeps the same Kyiv day before 20:00 EET and rolls at 20:00", () => {
    const before = new Date("2026-01-15T17:59:00.000Z");
    const atOpen = new Date("2026-01-15T18:00:00.000Z");
    expect(toOpenKyivSliceDate(before).toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(toOpenKyivSliceDate(atOpen).toISOString()).toBe("2026-01-16T00:00:00.000Z");
  });

  it("evening before the slice day and the morning of that day share one key", () => {
    const evening = new Date("2026-10-25T18:00:00.000Z");
    const morning = new Date("2026-10-26T06:00:00.000Z");
    const nextEvening = new Date("2026-10-26T18:00:00.000Z");
    expect(toOpenKyivSliceDate(evening).toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(toOpenKyivSliceDate(morning).toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(toOpenKyivSliceDate(nextEvening).toISOString()).toBe("2026-10-27T00:00:00.000Z");
  });
});
