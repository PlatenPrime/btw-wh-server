import { describe, expect, it } from "vitest";
import { IPos } from "../../../models/Pos.js";
import { getPositionSectorUtil } from "../getPositionSector.js";

const createPosition = (sector?: number): IPos =>
  ({
    palletData: { sector },
  }) as IPos;

describe("getPositionSectorUtil", () => {
  it("returns sector number when valid", () => {
    expect(getPositionSectorUtil(createPosition(3))).toBe(3);
    expect(getPositionSectorUtil(createPosition(0))).toBe(0);
  });

  it("returns 0 for null, undefined, or NaN sector", () => {
    expect(getPositionSectorUtil(createPosition(undefined))).toBe(0);
    expect(getPositionSectorUtil(createPosition(Number.NaN))).toBe(0);
  });

  it("returns 0 for non-number sector", () => {
    expect(
      getPositionSectorUtil({
        palletData: { sector: "5" as unknown as number },
      } as IPos)
    ).toBe(0);
  });
});
