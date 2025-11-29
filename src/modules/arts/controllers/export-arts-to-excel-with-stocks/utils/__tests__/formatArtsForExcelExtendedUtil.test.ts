import { describe, expect, it } from "vitest";
import { IArt } from "../../../../models/Art.js";
import { formatArtsForExcelExtendedUtil } from "../formatArtsForExcelExtendedUtil.js";

describe("formatArtsForExcelExtendedUtil", () => {
  it("форматирует полные данные с расчетом Запасы и Витрина", () => {
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
        createdAt: new Date("2024-01-01T10:00:00Z"),
        updatedAt: new Date("2024-01-02T10:00:00Z"),
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();
    posesQuantMap.set("ART-001", 20);

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      Артикул: "ART-001",
      Факт: "",
      Вітрина: 30, // 50 - 20
      Сайт: 50,
      Склад: 20,
      "Назва (укр)": "Тестовий артикул",
      Зона: "A1",
      Ліміт: 100,
      Маркер: "MARK",
      "Дата зрізу": new Date(
        "2024-01-15T10:00:00Z"
      ).toLocaleDateString("uk-UA"),
    });
  });

  it("расчет Запасы - получает значение из Map, 0 если нет в Map", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        zone: "A1",
      } as IArt,
      {
        _id: {} as any,
        artikul: "ART-002",
        zone: "B2",
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();
    posesQuantMap.set("ART-001", 15);
    // ART-002 нет в Map

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result[0].Склад).toBe(15);
    expect(result[1].Склад).toBe(0);
  });

  it("расчет Витрина - проверка формулы: btradeStock.value - Запасы", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        zone: "A1",
        btradeStock: {
          value: 100,
          date: new Date(),
        },
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();
    posesQuantMap.set("ART-001", 30);

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result[0].Вітрина).toBe(70); // 100 - 30
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

    const posesQuantMap = new Map<string, number>();

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      Артикул: "ART-002",
      Факт: "",
      Вітрина: 0,
      Сайт: 0,
      Склад: 0,
      "Назва (укр)": "",
      Зона: "B2",
      Ліміт: "",
      Маркер: "",
      "Дата зрізу": "",
    });
  });

  it("обрабатывает отсутствие btradeStock - используется 0", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-003",
        zone: "C3",
        btradeStock: null as any,
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();
    posesQuantMap.set("ART-003", 10);

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result[0].Сайт).toBe(0);
    expect(result[0].Вітрина).toBe(-10); // 0 - 10 (отрицательная витрина)
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

    const posesQuantMap = new Map<string, number>();

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result[0]["Дата зрізу"]).toBe(
      testDate.toLocaleDateString("uk-UA")
    );
  });

  it("возвращает пустой массив для пустого входного массива", () => {
    const arts: IArt[] = [];
    const posesQuantMap = new Map<string, number>();

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("обрабатывает отрицательную витрину когда Запасы > btradeStock.value", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-005",
        zone: "E5",
        btradeStock: {
          value: 30,
          date: new Date(),
        },
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();
    posesQuantMap.set("ART-005", 50); // Запасы больше чем btradeStock

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result[0].Вітрина).toBe(-20); // 30 - 50 = -20
  });

  it("обрабатывает несколько артикулов с разными значениями", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        zone: "A1",
        btradeStock: {
          value: 100,
          date: new Date(),
        },
      } as IArt,
      {
        _id: {} as any,
        artikul: "ART-002",
        zone: "B2",
        btradeStock: {
          value: 50,
          date: new Date(),
        },
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();
    posesQuantMap.set("ART-001", 20);
    posesQuantMap.set("ART-002", 10);

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result).toHaveLength(2);
    expect(result[0].Артикул).toBe("ART-001");
    expect(result[0].Склад).toBe(20);
    expect(result[0].Вітрина).toBe(80);
    expect(result[1].Артикул).toBe("ART-002");
    expect(result[1].Склад).toBe(10);
    expect(result[1].Вітрина).toBe(40);
  });

  it("обрабатывает limit равный 0", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-006",
        zone: "F6",
        limit: 0,
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result[0].Ліміт).toBe(0);
  });

  it("обрабатывает btradeStock без даты", () => {
    const arts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-007",
        zone: "G7",
        btradeStock: {
          value: 100,
          date: undefined as any,
        },
      } as IArt,
    ];

    const posesQuantMap = new Map<string, number>();

    const result = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    expect(result[0].Сайт).toBe(100);
    expect(result[0]["Дата зрізу"]).toBe("");
  });
});
