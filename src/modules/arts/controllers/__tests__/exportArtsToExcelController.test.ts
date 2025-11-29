import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportArtsToExcelController } from "../export-arts-to-excel/exportArtsToExcelController.js";
import { formatArtsForExcelUtil } from "../export-arts-to-excel/utils/formatArtsForExcelUtil.js";
import { generateExcelUtil } from "../export-arts-to-excel/utils/generateExcelUtil.js";
import { getArtsForExportUtil } from "../export-arts-to-excel/utils/getArtsForExportUtil.js";
import { IArt } from "../../models/Art.js";
import { ExcelArtRow } from "../export-arts-to-excel/utils/types.js";

// Мокаем утилиты
vi.mock("../export-arts-to-excel/utils/getArtsForExportUtil.js");
vi.mock("../export-arts-to-excel/utils/formatArtsForExcelUtil.js");
vi.mock("../export-arts-to-excel/utils/generateExcelUtil.js");

describe("exportArtsToExcelController", () => {
  let res: Response;
  let responseStatus: any;
  let responseHeaders: Record<string, string | number>;
  let responseBody: any;
  let headersSent: boolean;

  beforeEach(() => {
    responseStatus = {};
    responseHeaders = {};
    responseBody = null;
    headersSent = false;

    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseBody = data;
        return this;
      },
      send: function (data: any) {
        responseBody = data;
        return this;
      },
      setHeader: function (name: string, value: string | number) {
        responseHeaders[name] = value;
        return this;
      },
      headersSent: false,
    } as unknown as Response;

    vi.clearAllMocks();
  });

  it("200: успешный экспорт артикулов", async () => {
    const mockArts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        nameukr: "Тест 1",
        namerus: "Тест 1",
        zone: "A1",
        limit: 100,
        marker: "MARK",
        btradeStock: {
          value: 50,
          date: new Date("2024-01-15"),
        },
      } as IArt,
    ];

    const mockExcelData: ExcelArtRow[] = [
      {
        Артикул: "ART-001",
        "Назва (укр)": "Тест 1",
        "Назва (рус)": "Тест 1",
        Зона: "A1",
        Ліміт: 100,
        Маркер: "MARK",
        "Залишки на сайті": 50,
        "Дата оновлення залишків": "15.01.2024",
      },
    ];

    const mockBuffer = Buffer.from("mock-excel-data");
    const mockFileName = "arts_export_2024-01-15.xlsx";

    vi.mocked(getArtsForExportUtil).mockResolvedValue(mockArts);
    vi.mocked(formatArtsForExcelUtil).mockReturnValue(mockExcelData);
    vi.mocked(generateExcelUtil).mockReturnValue({
      buffer: mockBuffer,
      fileName: mockFileName,
    });

    const req = {} as unknown as Request;

    await exportArtsToExcelController(req, res);

    expect(getArtsForExportUtil).toHaveBeenCalledTimes(1);
    expect(formatArtsForExcelUtil).toHaveBeenCalledWith(mockArts);
    expect(generateExcelUtil).toHaveBeenCalledWith(mockExcelData);
    expect(responseStatus.code).toBe(200);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    // Проверяем RFC 5987 формат заголовка
    const contentDisposition = responseHeaders["Content-Disposition"] as string;
    expect(contentDisposition).toContain(`attachment; filename="${mockFileName}"`);
    expect(contentDisposition).toContain(`filename*=UTF-8''${encodeURIComponent(mockFileName)}`);
    expect(responseHeaders["Content-Length"]).toBe(mockBuffer.length);
    expect(responseBody).toBe(mockBuffer);
  });

  it("404: артикулы не найдены", async () => {
    vi.mocked(getArtsForExportUtil).mockResolvedValue([]);

    const req = {} as unknown as Request;

    await exportArtsToExcelController(req, res);

    expect(getArtsForExportUtil).toHaveBeenCalledTimes(1);
    expect(formatArtsForExcelUtil).not.toHaveBeenCalled();
    expect(generateExcelUtil).not.toHaveBeenCalled();
    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({
      message: "No arts found to export",
    });
  });

  it("404: артикулы null", async () => {
    vi.mocked(getArtsForExportUtil).mockResolvedValue(null as any);

    const req = {} as unknown as Request;

    await exportArtsToExcelController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({
      message: "No arts found to export",
    });
  });

  it("500: ошибка сервера при получении артикулов", async () => {
    const error = new Error("Database error");
    vi.mocked(getArtsForExportUtil).mockRejectedValue(error);

    const req = {} as unknown as Request;

    await exportArtsToExcelController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseBody.message).toBe("Server error");
    expect(responseBody.error).toBeDefined();
  });

  it("500: ошибка сервера при форматировании данных", async () => {
    const mockArts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        zone: "A1",
      } as IArt,
    ];

    const error = new Error("Format error");
    vi.mocked(getArtsForExportUtil).mockResolvedValue(mockArts);
    vi.mocked(formatArtsForExcelUtil).mockImplementation(() => {
      throw error;
    });

    const req = {} as unknown as Request;

    await exportArtsToExcelController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseBody.message).toBe("Server error");
  });

  it("500: ошибка сервера при генерации Excel", async () => {
    const mockArts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        zone: "A1",
      } as IArt,
    ];

    const mockExcelData: ExcelArtRow[] = [
      {
        Артикул: "ART-001",
        "Назва (укр)": "",
        "Назва (рус)": "",
        Зона: "A1",
        Ліміт: "",
        Маркер: "",
        "Залишки на сайті": "",
        "Дата оновлення залишків": "",
      },
    ];

    const error = new Error("Excel generation error");
    vi.mocked(getArtsForExportUtil).mockResolvedValue(mockArts);
    vi.mocked(formatArtsForExcelUtil).mockReturnValue(mockExcelData);
    vi.mocked(generateExcelUtil).mockImplementation(() => {
      throw error;
    });

    const req = {} as unknown as Request;

    await exportArtsToExcelController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseBody.message).toBe("Server error");
  });

  it("500: не отправляет ответ если заголовки уже отправлены", async () => {
    const error = new Error("Error after headers sent");
    res.headersSent = true;

    vi.mocked(getArtsForExportUtil).mockRejectedValue(error);

    const req = {} as unknown as Request;

    await exportArtsToExcelController(req, res);

    // Проверяем что responseBody не был установлен (не было вызова json)
    expect(responseBody).toBeNull();
  });
});

