import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { sortPosesByPalletSector } from "./sortPosesByPalletSector.js";

function mapPosesToSector(poses: { palletData: { sector?: number } }[]) {
  return poses.map((p) =>
    typeof p.palletData.sector === "number"
      ? String(p.palletData.sector)
      : "null",
  );
}

describe("sortPosesByPalletSector", () => {
  it("сортирует позиции по сектору паллеты в порядке возрастания", () => {
    const poses = [
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-10",
          sector: 5,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-2",
          sector: 1,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-10",
          sector: 3,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-2",
          sector: 2,
          isDef: false,
        },
      },
    ];

    const sorted = sortPosesByPalletSector([...poses]);
    expect(mapPosesToSector(sorted)).toEqual(["1", "2", "3", "5"]);
  });

  it("обрабатывает отсутствующие секторы как 0 (ставит их первыми)", () => {
    const poses = [
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-1",
          sector: 5,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-1",
          sector: undefined,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-2",
          sector: 2,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "3-1",
          sector: null as any,
          isDef: false,
        },
      },
    ];

    const sorted = sortPosesByPalletSector([...poses]);
    expect(mapPosesToSector(sorted)).toEqual(["null", "null", "2", "5"]);
  });

  it("работает с одинаковыми секторами (не меняет порядок)", () => {
    const poses = [
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-1",
          sector: 2,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-2",
          sector: 2,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-1",
          sector: 3,
          isDef: false,
        },
      },
    ];

    const sorted = sortPosesByPalletSector([...poses]);
    expect(mapPosesToSector(sorted)).toEqual(["2", "2", "3"]);
  });

  it("работает с пустым массивом", () => {
    expect(sortPosesByPalletSector([])).toEqual([]);
  });

  it("не меняет порядок, если уже отсортировано", () => {
    const poses = [
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-1",
          sector: 1,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-2",
          sector: 2,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-1",
          sector: 3,
          isDef: false,
        },
      },
    ];

    const sorted = sortPosesByPalletSector([...poses]);
    expect(mapPosesToSector(sorted)).toEqual(["1", "2", "3"]);
  });

  it("корректно обрабатывает большие числа", () => {
    const poses = [
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "1-1",
          sector: 1001,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "2-1",
          sector: 10,
          isDef: false,
        },
      },
      {
        palletData: {
          _id: new Types.ObjectId(),
          title: "3-1",
          sector: 100,
          isDef: false,
        },
      },
    ];

    const sorted = sortPosesByPalletSector([...poses]);
    expect(mapPosesToSector(sorted)).toEqual(["10", "100", "1001"]);
  });
});
