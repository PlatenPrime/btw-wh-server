import { describe, expect, it } from "vitest";
import { mergePoses } from "../mergePoses.js";

// Упрощенный интерфейс для тестов
interface ITestPos {
  _id: string;
  artikul: string;
  nameukr?: string;
  quant?: number;
  boxes?: number;
  sklad?: string;
  pallet: any;
  row: any;
  createdAt: Date;
  updatedAt: Date;
}

describe("mergePoses", () => {
  it("должна объединять позиции по артикулу", () => {
    const poses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet2" as any,
        row: "row2" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "3",
        artikul: "ART002",
        nameukr: "Товар 2",
        quant: 3,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet3" as any,
        row: "row3" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = mergePoses(poses as any);

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 15,
        boxes: 3,
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 3,
        boxes: 1,
      },
    });
  });

  it("должна обрабатывать позиции с нулевыми значениями", () => {
    const poses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 0,
        boxes: 0,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet2" as any,
        row: "row2" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = mergePoses(poses as any);

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
      },
    });
  });

  it("должна обрабатывать позиции с undefined значениями", () => {
    const poses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: undefined,
        boxes: undefined,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet2" as any,
        row: "row2" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = mergePoses(poses as any);

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
      },
    });
  });

  it("должна использовать nameukr из первой позиции", () => {
    const poses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: undefined,
        quant: 5,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 3,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet2" as any,
        row: "row2" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = mergePoses(poses as any);

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 8,
        boxes: 2,
      },
    });
  });

  it("должна возвращать пустой объект для пустого массива", () => {
    const result = mergePoses([]);

    expect(result).toEqual({});
  });

  it("должна обрабатывать позиции с разными складами", () => {
    const poses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
        sklad: "magazin",
        pallet: "pallet2" as any,
        row: "row2" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = mergePoses(poses as any);

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 15,
        boxes: 3,
      },
    });
  });
});
