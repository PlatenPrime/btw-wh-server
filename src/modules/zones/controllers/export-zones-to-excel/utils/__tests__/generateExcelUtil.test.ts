import { beforeEach, describe, expect, it } from "vitest";
import { generateExcelUtil } from "../generateExcelUtil.js";

describe("generateExcelUtil", () => {
  it("генерирует Excel файл с корректной структурой", () => {
    const excelData = [
      {
        "Назва": "1-1",
        Штрихкод: 10101,
        Сектор: 0,
      },
      {
        "Назва": "2-1",
        Штрихкод: 20201,
        Сектор: 1,
      },
    ];

    const result = generateExcelUtil(excelData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.fileName).toMatch(/^zones_export_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it("генерирует корректное имя файла с текущей датой", () => {
    const excelData = [
      {
        "Назва": "1-1",
        Штрихкод: 10101,
        Сектор: 0,
      }
    ];

    const result = generateExcelUtil(excelData);

    expect(result.fileName).toBe(`zones_export_${new Date().toISOString().split("T")[0]}.xlsx`);
  });

  it("обрабатывает пустой массив данных", () => {
    const result = generateExcelUtil([]);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.fileName).toMatch(/^zones_export_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});

