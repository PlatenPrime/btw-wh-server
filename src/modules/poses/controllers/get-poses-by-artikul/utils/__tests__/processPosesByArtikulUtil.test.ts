import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import { processPosesByArtikulUtil } from "../processPosesByArtikulUtil.js";
import { GetPosesByArtikulResponse } from "../../../../types/getPosesByArtikulResponse.js";

// Мокаем зависимости
vi.mock("../getPosesByArtikulUtil.js", () => ({
  getPosesByArtikulUtil: vi.fn(),
}));

vi.mock("../groupPosesByWarehouseUtil.js", () => ({
  groupPosesByWarehouseUtil: vi.fn(),
}));

vi.mock("../calculateWarehouseDataUtil.js", () => ({
  calculateWarehouseDataUtil: vi.fn(),
}));

vi.mock("../../../../../pallets/utils/sortPosesByPalletSector.js", () => ({
  sortPosesByPalletSector: vi.fn(),
}));

import { getPosesByArtikulUtil } from "../getPosesByArtikulUtil.js";
import { groupPosesByWarehouseUtil } from "../groupPosesByWarehouseUtil.js";
import { calculateWarehouseDataUtil } from "../calculateWarehouseDataUtil.js";
import { sortPosesByPalletSector } from "../../../../../pallets/utils/sortPosesByPalletSector.js";
import { IPos } from "../../../../models/Pos.js";

describe("processPosesByArtikulUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("возвращает пустой ответ для пустого массива позиций", async () => {
    (getPosesByArtikulUtil as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await processPosesByArtikulUtil("TEST-ART");

    const expected: GetPosesByArtikulResponse = {
      total: 0,
      pogrebi: { poses: [], quant: 0, boxes: 0 },
      merezhi: { poses: [], quant: 0, boxes: 0 },
      totalQuant: 0,
      totalBoxes: 0,
    };

    expect(result).toEqual(expected);
    expect(getPosesByArtikulUtil).toHaveBeenCalledWith("TEST-ART");
    expect(groupPosesByWarehouseUtil).not.toHaveBeenCalled();
    expect(sortPosesByPalletSector).not.toHaveBeenCalled();
    expect(calculateWarehouseDataUtil).not.toHaveBeenCalled();
  });

  it("обрабатывает позиции с разными складами и возвращает корректный ответ", async () => {
    const mockPoses: IPos[] = [
      {
        _id: new Types.ObjectId(),
        artikul: "TEST-ART",
        quant: 10,
        boxes: 2,
        sklad: "pogrebi",
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-1",
          sector: "1",
          isDef: false,
        },
        rowData: {
          _id: new Types.ObjectId(),
          title: "Row-1",
        },
        palletTitle: "1-1",
        rowTitle: "Row-1",
        pallet: new Types.ObjectId(),
        row: new Types.ObjectId(),
      } as IPos,
      {
        _id: new Types.ObjectId(),
        artikul: "TEST-ART",
        quant: 20,
        boxes: 4,
        sklad: "merezhi",
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-1",
          sector: "2",
          isDef: false,
        },
        rowData: {
          _id: new Types.ObjectId(),
          title: "Row-2",
        },
        palletTitle: "2-1",
        rowTitle: "Row-2",
        pallet: new Types.ObjectId(),
        row: new Types.ObjectId(),
      } as IPos,
      {
        _id: new Types.ObjectId(),
        artikul: "TEST-ART",
        quant: 5,
        boxes: 1,
        sklad: "pogrebi",
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-2",
          sector: "3",
          isDef: false,
        },
        rowData: {
          _id: new Types.ObjectId(),
          title: "Row-1",
        },
        palletTitle: "1-2",
        rowTitle: "Row-1",
        pallet: new Types.ObjectId(),
        row: new Types.ObjectId(),
      } as IPos,
    ];

    const pogrebiPoses = [mockPoses[0], mockPoses[2]];
    const merezhiPoses = [mockPoses[1]];

    (getPosesByArtikulUtil as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPoses
    );
    (groupPosesByWarehouseUtil as ReturnType<typeof vi.fn>).mockReturnValue({
      pogrebi: pogrebiPoses,
      merezhi: merezhiPoses,
      other: [],
    });
    (calculateWarehouseDataUtil as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        poses: pogrebiPoses,
        quant: 15,
        boxes: 3,
      })
      .mockReturnValueOnce({
        poses: merezhiPoses,
        quant: 20,
        boxes: 4,
      });

    const result = await processPosesByArtikulUtil("TEST-ART");

    expect(result).toEqual({
      total: 3,
      pogrebi: { poses: pogrebiPoses, quant: 15, boxes: 3 },
      merezhi: { poses: merezhiPoses, quant: 20, boxes: 4 },
      totalQuant: 35,
      totalBoxes: 7,
    });

    expect(getPosesByArtikulUtil).toHaveBeenCalledWith("TEST-ART");
    expect(groupPosesByWarehouseUtil).toHaveBeenCalledWith(mockPoses);
    expect(sortPosesByPalletSector).toHaveBeenCalledTimes(2);
    expect(sortPosesByPalletSector).toHaveBeenNthCalledWith(1, pogrebiPoses);
    expect(sortPosesByPalletSector).toHaveBeenNthCalledWith(2, merezhiPoses);
    expect(calculateWarehouseDataUtil).toHaveBeenCalledTimes(2);
    expect(calculateWarehouseDataUtil).toHaveBeenNthCalledWith(
      1,
      pogrebiPoses
    );
    expect(calculateWarehouseDataUtil).toHaveBeenNthCalledWith(2, merezhiPoses);
  });

  it("корректно рассчитывает общие суммы для всех позиций", async () => {
    const mockPoses: IPos[] = [
      {
        _id: new Types.ObjectId(),
        artikul: "TEST-ART",
        quant: 100,
        boxes: 10,
        sklad: "pogrebi",
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-1",
          sector: "1",
          isDef: false,
        },
        rowData: {
          _id: new Types.ObjectId(),
          title: "Row-1",
        },
        palletTitle: "1-1",
        rowTitle: "Row-1",
        pallet: new Types.ObjectId(),
        row: new Types.ObjectId(),
      } as IPos,
      {
        _id: new Types.ObjectId(),
        artikul: "TEST-ART",
        quant: 50,
        boxes: 5,
        sklad: "merezhi",
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-1",
          sector: "2",
          isDef: false,
        },
        rowData: {
          _id: new Types.ObjectId(),
          title: "Row-2",
        },
        palletTitle: "2-1",
        rowTitle: "Row-2",
        pallet: new Types.ObjectId(),
        row: new Types.ObjectId(),
      } as IPos,
    ];

    (getPosesByArtikulUtil as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPoses
    );
    (groupPosesByWarehouseUtil as ReturnType<typeof vi.fn>).mockReturnValue({
      pogrebi: [mockPoses[0]],
      merezhi: [mockPoses[1]],
      other: [],
    });
    (calculateWarehouseDataUtil as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        poses: [mockPoses[0]],
        quant: 100,
        boxes: 10,
      })
      .mockReturnValueOnce({
        poses: [mockPoses[1]],
        quant: 50,
        boxes: 5,
      });

    const result = await processPosesByArtikulUtil("TEST-ART");

    expect(result.totalQuant).toBe(150);
    expect(result.totalBoxes).toBe(15);
    expect(result.total).toBe(2);
  });

  it("сортирует позиции по сектору перед расчетом данных по складам", async () => {
    const mockPoses: IPos[] = [
      {
        _id: new Types.ObjectId(),
        artikul: "TEST-ART",
        quant: 10,
        boxes: 1,
        sklad: "pogrebi",
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-1",
          sector: "5",
          isDef: false,
        },
        rowData: {
          _id: new Types.ObjectId(),
          title: "Row-1",
        },
        palletTitle: "1-1",
        rowTitle: "Row-1",
        pallet: new Types.ObjectId(),
        row: new Types.ObjectId(),
      } as IPos,
    ];

    const pogrebiPoses = [...mockPoses];

    (getPosesByArtikulUtil as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPoses
    );
    (groupPosesByWarehouseUtil as ReturnType<typeof vi.fn>).mockReturnValue({
      pogrebi: pogrebiPoses,
      merezhi: [],
      other: [],
    });
    (calculateWarehouseDataUtil as ReturnType<typeof vi.fn>).mockReturnValue({
      poses: pogrebiPoses,
      quant: 10,
      boxes: 1,
    });

    await processPosesByArtikulUtil("TEST-ART");

    // Проверяем порядок вызовов: сначала сортировка, потом расчет
    expect(sortPosesByPalletSector).toHaveBeenCalledBefore(
      calculateWarehouseDataUtil as ReturnType<typeof vi.fn>
    );
  });
});

