import { describe, expect, it } from "vitest";
import { IArt } from "../../../../models/Art.js";
import { formatArtsForExcelWithKeysUtil } from "../formatArtsForExcelWithKeysUtil.js";

describe("formatArtsForExcelWithKeysUtil", () => {
  it("форматирует данные с key-based заголовками", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        prodName: "Gemar",
        nameukr: "Тестовий артикул",
        namerus: "Тестовый артикул",
        zone: "A1",
        limit: 100,
        marker: "MARK",
        abc: "A",
      } as IArt,
    ];

    const result = formatArtsForExcelWithKeysUtil(arts);

    expect(result).toEqual([
      {
        artikul: "ART-001",
        prodName: "Gemar",
        nameukr: "Тестовий артикул",
        namerus: "Тестовый артикул",
        zone: "A1",
        limit: 100,
        marker: "MARK",
        abc: "A",
      },
    ]);
  });

  it("подставляет пустые строки для undefined полей", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-002",
        zone: "B2",
        prodName: undefined,
        nameukr: undefined,
        namerus: undefined,
        marker: undefined,
        abc: undefined,
      } as IArt,
    ];

    const result = formatArtsForExcelWithKeysUtil(arts);

    expect(result).toEqual([
      {
        artikul: "ART-002",
        prodName: "",
        nameukr: "",
        namerus: "",
        zone: "B2",
        limit: "",
        marker: "",
        abc: "",
      },
    ]);
  });
});

