import { describe, expect, it } from "vitest";
import { IArt } from "../../../../models/Art.js";
import { formatArtsForExcelUtil } from "../formatArtsForExcelUtil.js";

describe("formatArtsForExcelUtil", () => {
  it("форматирует полные данные", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        nameukr: "Тестовий артикул",
        namerus: "Тестовый артикул",
        zone: "A1",
        limit: 100,
        marker: "MARK",
        btradeStock: {
          value: 50,
          date: new Date("2024-01-15T10:00:00Z"),
        },
      } as IArt,
    ];

    const result = formatArtsForExcelUtil(arts);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      Артикул: "ART-001",
      "Назва (укр)": "Тестовий артикул",
      "Назва (рус)": "Тестовый артикул",
      Зона: "A1",
      Ліміт: 100,
      Маркер: "MARK",
      "Залишки на сайті": 50,
      "Дата оновлення залишків": new Date("2024-01-15T10:00:00Z").toLocaleDateString("uk-UA"),
    });
  });

  it("обрабатывает пустые/undefined значения", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-002",
        nameukr: undefined,
        namerus: undefined,
        zone: "B2",
        marker: undefined,
      } as IArt,
    ];

    const result = formatArtsForExcelUtil(arts);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      Артикул: "ART-002",
      "Назва (укр)": "",
      "Назва (рус)": "",
      Зона: "B2",
      Ліміт: "",
      Маркер: "",
      "Залишки на сайті": "",
      "Дата оновлення залишків": "",
    });
  });

  it("обрабатывает null значения для limit и btradeStock", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-003",
        nameukr: "Тест",
        namerus: "Тест",
        zone: "C3",
        limit: null as any,
        marker: "TEST",
        btradeStock: null as any,
      } as IArt,
    ];

    const result = formatArtsForExcelUtil(arts);

    expect(result).toHaveLength(1);
    expect(result[0].Ліміт).toBe("");
    expect(result[0]["Залишки на сайті"]).toBe("");
    expect(result[0]["Дата оновлення залишків"]).toBe("");
  });

  it("форматирует дату в формате uk-UA", () => {
    const testDate = new Date("2024-03-20T15:30:00Z");
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-004",
        zone: "D4",
        btradeStock: {
          value: 75,
          date: testDate,
        },
      } as IArt,
    ];

    const result = formatArtsForExcelUtil(arts);

    expect(result[0]["Дата оновлення залишків"]).toBe(
      testDate.toLocaleDateString("uk-UA")
    );
  });

  it("возвращает пустой массив для пустого входного массива", () => {
    const arts: IArt[] = [];

    const result = formatArtsForExcelUtil(arts);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("обрабатывает несколько артикулов", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        nameukr: "Артикул 1",
        namerus: "Артикул 1",
        zone: "A1",
        limit: 10,
        marker: "M1",
      } as IArt,
      {
        _id: {} as any,
        artikul: "ART-002",
        nameukr: "Артикул 2",
        namerus: "Артикул 2",
        zone: "B2",
        limit: 20,
        marker: "M2",
        btradeStock: {
          value: 15,
          date: new Date("2024-01-01"),
        },
      } as IArt,
    ];

    const result = formatArtsForExcelUtil(arts);

    expect(result).toHaveLength(2);
    expect(result[0].Артикул).toBe("ART-001");
    expect(result[1].Артикул).toBe("ART-002");
    expect(result[0].Ліміт).toBe(10);
    expect(result[1].Ліміт).toBe(20);
  });

  it("обрабатывает limit равный 0", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-005",
        zone: "E5",
        limit: 0,
      } as IArt,
    ];

    const result = formatArtsForExcelUtil(arts);

    expect(result[0].Ліміт).toBe(0);
  });

  it("обрабатывает btradeStock без даты", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-006",
        zone: "F6",
        btradeStock: {
          value: 100,
          date: undefined as any,
        },
      } as IArt,
    ];

    const result = formatArtsForExcelUtil(arts);

    expect(result[0]["Залишки на сайті"]).toBe(100);
    expect(result[0]["Дата оновлення залишків"]).toBe("");
  });
});

