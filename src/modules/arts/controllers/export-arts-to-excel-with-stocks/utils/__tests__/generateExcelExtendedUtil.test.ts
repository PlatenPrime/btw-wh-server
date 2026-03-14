import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { ExcelArtRowExtended } from "../types.js";
import { generateExcelExtendedUtil } from "../generateExcelExtendedUtil.js";

async function readSheetToJson(buffer: Buffer): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.getWorksheet("Артикулы");
  if (!worksheet) return [];
  const rows: Record<string, unknown>[] = [];
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const v = cell.value;
    headers[colNumber - 1] = typeof v === "string" ? v : String(v ?? "");
  });
  const rowCount = worksheet.rowCount ?? 0;
  for (let r = 2; r <= rowCount; r++) {
    const row = worksheet.getRow(r);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      obj[h] = cell.value ?? "";
    });
    rows.push(obj);
  }
  return rows;
}

describe("generateExcelExtendedUtil", () => {
  it("генерирует Excel файл с корректной структурой", async () => {
    const excelData: ExcelArtRowExtended[] = [
      {
        Артикул: "ART-001",
        Факт: "",
        Вітрина: 30,
        Сайт: 50,
        Склад: 20,
        "Назва (укр)": "Тестовий артикул",
        Зона: "A1",
        Ліміт: 100,
        Маркер: "MARK",
        ABC: "",
        "Дата зрізу": "15.01.2024",
      },
      {
        Артикул: "ART-002",
        Факт: "",
        Вітрина: 40,
        Сайт: 50,
        Склад: 10,
        "Назва (укр)": "Інший артикул",
        Зона: "B2",
        Ліміт: 200,
        Маркер: "MARK2",
        ABC: "",
        "Дата зрізу": "20.01.2024",
      },
    ];

    const result = await generateExcelExtendedUtil(excelData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.fileName).toMatch(
      /^arts_export_with_stocks_\d{4}-\d{2}-\d{2}\.xlsx$/
    );
  });

  it("генерирует корректное имя файла с текущей датой", async () => {
    const excelData: ExcelArtRowExtended[] = [
      {
        Артикул: "ART-001",
        Факт: "",
        Вітрина: 30,
        Сайт: 50,
        Склад: 20,
        "Назва (укр)": "Тест",
        Зона: "A1",
        Ліміт: 100,
        Маркер: "MARK",
        ABC: "",
        "Дата зрізу": "15.01.2024",
      },
    ];

    const today = new Date().toISOString().split("T")[0];
    const result = await generateExcelExtendedUtil(excelData);

    expect(result.fileName).toBe(`arts_export_with_stocks_${today}.xlsx`);
  });

  it("обрабатывает пустой массив данных", async () => {
    const result = await generateExcelExtendedUtil([]);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.fileName).toMatch(
      /^arts_export_with_stocks_\d{4}-\d{2}-\d{2}\.xlsx$/
    );
  });

  it("проверяет структуру Excel файла - можно прочитать буфер", async () => {
    const excelData: ExcelArtRowExtended[] = [
      {
        Артикул: "ART-001",
        Факт: "",
        Вітрина: 30,
        Сайт: 50,
        Склад: 20,
        "Назва (укр)": "Тест",
        Зона: "A1",
        Ліміт: 100,
        Маркер: "MARK",
        ABC: "",
        "Дата зрізу": "15.01.2024",
      },
    ];

    const result = await generateExcelExtendedUtil(excelData);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as unknown as ArrayBuffer);
    expect(workbook.worksheets.map((ws) => ws.name)).toContain("Артикулы");

    const worksheet = workbook.getWorksheet("Артикулы");
    expect(worksheet).toBeDefined();

    const jsonData = await readSheetToJson(result.buffer);
    expect(jsonData).toHaveLength(1);
    expect(jsonData[0]!["Артикул"]).toBe("ART-001");
  });

  it("генерирует файл с корректной структурой листа", async () => {
    const excelData: ExcelArtRowExtended[] = [
      {
        Артикул: "ART-001",
        Факт: "",
        Вітрина: 30,
        Сайт: 50,
        Склад: 20,
        "Назва (укр)": "Тест",
        Зона: "A1",
        Ліміт: 100,
        Маркер: "MARK",
        ABC: "",
        "Дата зрізу": "15.01.2024",
      },
    ];

    const result = await generateExcelExtendedUtil(excelData);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as unknown as ArrayBuffer);
    const worksheet = workbook.getWorksheet("Артикулы");

    expect(worksheet).toBeDefined();
    expect(worksheet!.rowCount).toBeGreaterThanOrEqual(1);

    const jsonData = await readSheetToJson(result.buffer);
    expect(jsonData).toHaveLength(1);
  });

  it("обрабатывает данные с разными типами значений", async () => {
    const excelData: ExcelArtRowExtended[] = [
      {
        Артикул: "ART-001",
        Факт: "",
        Вітрина: 0,
        Сайт: "",
        Склад: 0,
        "Назва (укр)": "Тест",
        Зона: "A1",
        Ліміт: 0,
        Маркер: "",
        ABC: "",
        "Дата зрізу": "",
      },
      {
        Артикул: "ART-002",
        Факт: "",
        Вітрина: -50,
        Сайт: 50,
        Склад: 100,
        "Назва (укр)": "",
        Зона: "B2",
        Ліміт: "",
        Маркер: "MARK",
        ABC: "",
        "Дата зрізу": "20.01.2024",
      },
    ];

    const result = await generateExcelExtendedUtil(excelData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);

    const jsonData = await readSheetToJson(result.buffer);
    expect(jsonData).toHaveLength(2);
  });
});
