import { describe, expect, it } from "vitest";
import { IPositionForPull } from "../../../get-ask-pull/types/getAskPullResponse.js";
import { groupPositionsBySectorUtil } from "../groupPositionsBySectorUtil.js";

describe("groupPositionsBySectorUtil", () => {
  it("группирует позиции по секторам", () => {
    const positions: IPositionForPull[] = [
      {
        _id: "pos1" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet1" as any, title: "Pallet 1", sector: 1, isDef: false },
        quant: 10,
        plannedQuant: 10,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
      {
        _id: "pos2" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet2" as any, title: "Pallet 2", sector: 1, isDef: false },
        quant: 5,
        plannedQuant: 5,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
      {
        _id: "pos3" as any,
        artikul: "ART-2",
        palletData: { _id: "pallet3" as any, title: "Pallet 3", sector: 2, isDef: false },
        quant: 8,
        plannedQuant: 8,
        askId: "ask2",
        askArtikul: "ART-2",
        askQuant: 8,
        askRemainingQuantity: 8,
      } as unknown as IPositionForPull,
    ];

    const result = groupPositionsBySectorUtil(positions);

    expect(result.length).toBe(2);
    expect(result[0].sector).toBe(1);
    expect(result[0].positions.length).toBe(2);
    expect(result[1].sector).toBe(2);
    expect(result[1].positions.length).toBe(1);
  });

  it("сортирует секторы по возрастанию", () => {
    const positions: IPositionForPull[] = [
      {
        _id: "pos1" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet1" as any, title: "Pallet 1", sector: 5, isDef: false },
        quant: 10,
        plannedQuant: 10,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
      {
        _id: "pos2" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet2" as any, title: "Pallet 2", sector: 1, isDef: false },
        quant: 5,
        plannedQuant: 5,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
      {
        _id: "pos3" as any,
        artikul: "ART-2",
        palletData: { _id: "pallet3" as any, title: "Pallet 3", sector: 3, isDef: false },
        quant: 8,
        plannedQuant: 8,
        askId: "ask2",
        askArtikul: "ART-2",
        askQuant: 8,
        askRemainingQuantity: 8,
      } as unknown as IPositionForPull,
    ];

    const result = groupPositionsBySectorUtil(positions);

    expect(result.length).toBe(3);
    expect(result[0].sector).toBe(1);
    expect(result[1].sector).toBe(3);
    expect(result[2].sector).toBe(5);
  });

  it("обрабатывает пустой массив", () => {
    const result = groupPositionsBySectorUtil([]);

    expect(result).toEqual([]);
  });

  it("обрабатывает позиции с одинаковыми секторами", () => {
    const positions: IPositionForPull[] = [
      {
        _id: "pos1" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet1" as any, title: "Pallet 1", sector: 1, isDef: false },
        quant: 10,
        plannedQuant: 10,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
      {
        _id: "pos2" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet2" as any, title: "Pallet 2", sector: 1, isDef: false },
        quant: 5,
        plannedQuant: 5,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
      {
        _id: "pos3" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet3" as any, title: "Pallet 3", sector: 1 },
        quant: 8,
        plannedQuant: 8,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
    ];

    const result = groupPositionsBySectorUtil(positions);

    expect(result.length).toBe(1);
    expect(result[0].sector).toBe(1);
    expect(result[0].positions.length).toBe(3);
  });

  it("обрабатывает позиции с сектором 0", () => {
    const positions: IPositionForPull[] = [
      {
        _id: "pos1" as any,
        artikul: "ART-1",
        palletData: { _id: "pallet1" as any, title: "Pallet 1", sector: 0, isDef: false },
        quant: 10,
        plannedQuant: 10,
        askId: "ask1",
        askArtikul: "ART-1",
        askQuant: 10,
        askRemainingQuantity: 10,
      } as unknown as IPositionForPull,
    ];

    const result = groupPositionsBySectorUtil(positions);

    expect(result.length).toBe(1);
    expect(result[0].sector).toBe(0);
    expect(result[0].positions.length).toBe(1);
  });
});

