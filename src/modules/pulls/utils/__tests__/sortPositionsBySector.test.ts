import { describe, expect, it } from "vitest";
import { IPos } from "../../../poses/models/Pos.js";
import { sortPositionsBySector } from "../sortPositionsBySector.js";

describe("sortPositionsBySector", () => {
  it("сортирует позиции по сектору по возрастанию", () => {
    const positions: IPos[] = [
      {
        palletData: {
          _id: {} as any,
          title: "Pallet 3",
          sector: "10",
          isDef: false,
        },
      } as unknown as IPos,
      {
        palletData: {
          _id: {} as any,
          title: "Pallet 1",
          sector: "5",
          isDef: false,
        },
      } as unknown as IPos,
      {
        palletData: {
          _id: {} as any,
          title: "Pallet 2",
          sector: "7",
          isDef: false,
        },
      } as unknown as IPos,
    ];

    const result = sortPositionsBySector(positions);

    expect(result[0].palletData.sector).toBe("5");
    expect(result[1].palletData.sector).toBe("7");
    expect(result[2].palletData.sector).toBe("10");
  });

  it("обрабатывает позиции без сектора (считает как 0)", () => {
    const positions: IPos[] = [
      {
        palletData: {
          _id: {} as any,
          title: "Pallet 2",
          sector: "5",
          isDef: false,
        },
      } as unknown as IPos,
      {
        palletData: {
          _id: {} as any,
          title: "Pallet 1",
          isDef: false,
        },
      } as unknown as IPos,
    ];

    const result = sortPositionsBySector(positions);

    expect(result[0].palletData.sector).toBeUndefined();
    expect(result[1].palletData.sector).toBe("5");
  });
});
