// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  getPositionSector,
  sortPositionsBySector,
} from "../sortPositionsBySector.js";

describe("sortPositionsBySector", () => {
  it("should sort positions by sector in ascending order", () => {
    const positions = [
      {
        _id: "pos1" as any,
        palletData: {
          _id: "pallet1" as any,
          title: "Pallet 1",
          sector: "3",
          isDef: false,
        },
        rowData: { _id: "row1" as any, title: "Row 1" },
        artikul: "ART001",
        quant: 10,
        boxes: 1,
        palletTitle: "Pallet 1",
        rowTitle: "Row 1",
        pallet: "pallet1" as any,
        row: "row1" as any,
        limit: 0,
        comment: "",
      },
      {
        _id: "pos2" as any,
        palletData: {
          _id: "pallet2" as any,
          title: "Pallet 2",
          sector: "1",
          isDef: false,
        },
        rowData: { _id: "row2" as any, title: "Row 2" },
        artikul: "ART002",
        quant: 5,
        boxes: 1,
        palletTitle: "Pallet 2",
        rowTitle: "Row 2",
        pallet: "pallet2" as any,
        row: "row2" as any,
        limit: 0,
        comment: "",
      },
      {
        _id: "pos3" as any,
        palletData: {
          _id: "pallet3" as any,
          title: "Pallet 3",
          sector: "2",
          isDef: false,
        },
        rowData: { _id: "row3" as any, title: "Row 3" },
        artikul: "ART003",
        quant: 8,
        boxes: 1,
        palletTitle: "Pallet 3",
        rowTitle: "Row 3",
        pallet: "pallet3" as any,
        row: "row3" as any,
        limit: 0,
        comment: "",
      },
    ];

    const sorted = sortPositionsBySector(positions);

    expect(sorted[0].palletData.sector).toBe("1");
    expect(sorted[1].palletData.sector).toBe("2");
    expect(sorted[2].palletData.sector).toBe("3");
  });

  it("should treat null/undefined sectors as 0", () => {
    const positions = [
      {
        _id: "pos1" as any,
        palletData: {
          _id: "pallet1" as any,
          title: "Pallet 1",
          sector: undefined,
          isDef: false,
        },
        rowData: { _id: "row1" as any, title: "Row 1" },
        artikul: "ART001",
        quant: 10,
        boxes: 1,
        palletTitle: "Pallet 1",
        rowTitle: "Row 1",
        pallet: "pallet1" as any,
        row: "row1" as any,
        limit: 0,
        comment: "",
      },
      {
        _id: "pos2" as any,
        palletData: {
          _id: "pallet2" as any,
          title: "Pallet 2",
          sector: "1",
          isDef: false,
        },
        rowData: { _id: "row2" as any, title: "Row 2" },
        artikul: "ART002",
        quant: 5,
        boxes: 1,
        palletTitle: "Pallet 2",
        rowTitle: "Row 2",
        pallet: "pallet2" as any,
        row: "row2" as any,
        limit: 0,
        comment: "",
      },
      {
        _id: "pos3" as any,
        palletData: {
          _id: "pallet3" as any,
          title: "Pallet 3",
          sector: null as any,
          isDef: false,
        },
        rowData: { _id: "row3" as any, title: "Row 3" },
        artikul: "ART003",
        quant: 8,
        boxes: 1,
        palletTitle: "Pallet 3",
        rowTitle: "Row 3",
        pallet: "pallet3" as any,
        row: "row3" as any,
        limit: 0,
        comment: "",
      },
    ];

    const sorted = sortPositionsBySector(positions);

    // Positions with null/undefined sectors should come first (treated as 0)
    expect(sorted[0].palletData.sector).toBeUndefined();
    expect(sorted[1].palletData.sector).toBeNull();
    expect(sorted[2].palletData.sector).toBe("1");
  });

  it("should handle empty array", () => {
    const positions = [];
    const sorted = sortPositionsBySector(positions);
    expect(sorted).toEqual([]);
  });

  it("should not mutate original array", () => {
    const positions = [
      {
        _id: "pos1" as any,
        palletData: {
          _id: "pallet1" as any,
          title: "Pallet 1",
          sector: "3",
          isDef: false,
        },
        rowData: { _id: "row1" as any, title: "Row 1" },
        artikul: "ART001",
        quant: 10,
        boxes: 1,
        palletTitle: "Pallet 1",
        rowTitle: "Row 1",
        pallet: "pallet1" as any,
        row: "row1" as any,
        limit: 0,
        comment: "",
      },
      {
        _id: "pos2" as any,
        palletData: {
          _id: "pallet2" as any,
          title: "Pallet 2",
          sector: "1",
          isDef: false,
        },
        rowData: { _id: "row2" as any, title: "Row 2" },
        artikul: "ART002",
        quant: 5,
        boxes: 1,
        palletTitle: "Pallet 2",
        rowTitle: "Row 2",
        pallet: "pallet2" as any,
        row: "row2" as any,
        limit: 0,
        comment: "",
      },
    ];

    const originalOrder = positions.map((p) => p.palletData.sector);
    sortPositionsBySector(positions);
    const afterSortOrder = positions.map((p) => p.palletData.sector);

    expect(originalOrder).toEqual(afterSortOrder);
  });
});

describe("getPositionSector", () => {
  it("should return sector number for valid sector", () => {
    const position = {
      _id: "pos1" as any,
      palletData: {
        _id: "pallet1" as any,
        title: "Pallet 1",
        sector: "5",
        isDef: false,
      },
      rowData: { _id: "row1" as any, title: "Row 1" },
      artikul: "ART001",
      quant: 10,
      boxes: 1,
      palletTitle: "Pallet 1",
      rowTitle: "Row 1",
      pallet: "pallet1" as any,
      row: "row1" as any,
      limit: 0,
      comment: "",
    };

    expect(getPositionSector(position)).toBe(5);
  });

  it("should return 0 for null sector", () => {
    const position = {
      _id: "pos1" as any,
      palletData: {
        _id: "pallet1" as any,
        title: "Pallet 1",
        sector: null as any,
        isDef: false,
      },
      rowData: { _id: "row1" as any, title: "Row 1" },
      artikul: "ART001",
      quant: 10,
      boxes: 1,
      palletTitle: "Pallet 1",
      rowTitle: "Row 1",
      pallet: "pallet1" as any,
      row: "row1" as any,
      limit: 0,
      comment: "",
    };

    expect(getPositionSector(position)).toBe(0);
  });

  it("should return 0 for undefined sector", () => {
    const position = {
      _id: "pos1" as any,
      palletData: {
        _id: "pallet1" as any,
        title: "Pallet 1",
        sector: undefined,
        isDef: false,
      },
      rowData: { _id: "row1" as any, title: "Row 1" },
      artikul: "ART001",
      quant: 10,
      boxes: 1,
      palletTitle: "Pallet 1",
      rowTitle: "Row 1",
      pallet: "pallet1" as any,
      row: "row1" as any,
      limit: 0,
      comment: "",
    };

    expect(getPositionSector(position)).toBe(0);
  });

  it("should parse string sector to number", () => {
    const position = {
      _id: "pos1" as any,
      palletData: {
        _id: "pallet1" as any,
        title: "Pallet 1",
        sector: "42",
        isDef: false,
      },
      rowData: { _id: "row1" as any, title: "Row 1" },
      artikul: "ART001",
      quant: 10,
      boxes: 1,
      palletTitle: "Pallet 1",
      rowTitle: "Row 1",
      pallet: "pallet1" as any,
      row: "row1" as any,
      limit: 0,
      comment: "",
    };

    expect(getPositionSector(position)).toBe(42);
  });
});
