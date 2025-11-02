import { describe, expect, it } from "vitest";
import { IPos } from "../../../poses/models/Pos.js";
import { getPositionSector } from "../getPositionSector.js";

describe("getPositionSector", () => {
  it("возвращает сектор из позиции", () => {
    const position = {
      palletData: {
        _id: {} as any,
        title: "Pallet 1",
        sector: "5",
        isDef: false,
      },
    } as unknown as IPos;

    const result = getPositionSector(position);
    expect(result).toBe(5);
  });

  it("возвращает 0 если сектор null", () => {
    const position = {
      palletData: {
        _id: {} as any,
        title: "Pallet 1",
        sector: null,
        isDef: false,
      },
    } as unknown as IPos;

    const result = getPositionSector(position);
    expect(result).toBe(0);
  });

  it("возвращает 0 если сектор undefined", () => {
    const position = {
      palletData: {
        _id: {} as any,
        title: "Pallet 1",
        isDef: false,
      },
    } as unknown as IPos;

    const result = getPositionSector(position);
    expect(result).toBe(0);
  });
});
