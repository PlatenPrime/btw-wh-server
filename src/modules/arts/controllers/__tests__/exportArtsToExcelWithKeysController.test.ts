import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IArt } from "../../models/Art.js";
import { exportArtsToExcelWithKeysController } from "../export-arts-to-excel-with-keys/exportArtsToExcelWithKeysController.js";
import { formatArtsForExcelWithKeysUtil } from "../export-arts-to-excel-with-keys/utils/formatArtsForExcelWithKeysUtil.js";
import { generateExcelWithKeysUtil } from "../export-arts-to-excel-with-keys/utils/generateExcelWithKeysUtil.js";
import { getArtsForExportWithKeysUtil } from "../export-arts-to-excel-with-keys/utils/getArtsForExportWithKeysUtil.js";
import { ExcelArtKeyRow } from "../export-arts-to-excel-with-keys/utils/types.js";

vi.mock("../export-arts-to-excel-with-keys/utils/getArtsForExportWithKeysUtil.js");
vi.mock("../export-arts-to-excel-with-keys/utils/formatArtsForExcelWithKeysUtil.js");
vi.mock("../export-arts-to-excel-with-keys/utils/generateExcelWithKeysUtil.js");

describe("exportArtsToExcelWithKeysController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseHeaders: Record<string, string | number>;
  let responseBody: unknown;

  beforeEach(() => {
    responseStatus = {};
    responseHeaders = {};
    responseBody = null;

    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: unknown) {
        responseBody = data;
        return this;
      },
      send: function (data: unknown) {
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

  it("200: успешно экспортирует key-based Excel", async () => {
    const mockArts: IArt[] = [
      {
        _id: {} as any,
        artikul: "ART-001",
        prodName: "Gemar",
        nameukr: "Тест 1",
        namerus: "Тест 1",
        zone: "A1",
        limit: 100,
        marker: "MARK",
        abc: "A",
      } as IArt,
    ];
    const mockExcelData: ExcelArtKeyRow[] = [
      {
        artikul: "ART-001",
        prodName: "Gemar",
        nameukr: "Тест 1",
        namerus: "Тест 1",
        zone: "A1",
        limit: 100,
        marker: "MARK",
        abc: "A",
      },
    ];
    const mockBuffer = Buffer.from("mock-excel-data");
    const mockFileName = "arts_export_keys_2026-04-08.xlsx";

    vi.mocked(getArtsForExportWithKeysUtil).mockResolvedValue(mockArts);
    vi.mocked(formatArtsForExcelWithKeysUtil).mockReturnValue(mockExcelData);
    vi.mocked(generateExcelWithKeysUtil).mockResolvedValue({
      buffer: mockBuffer,
      fileName: mockFileName,
    });

    const req = {} as Request;
    await exportArtsToExcelWithKeysController(req, res);

    expect(getArtsForExportWithKeysUtil).toHaveBeenCalledTimes(1);
    expect(formatArtsForExcelWithKeysUtil).toHaveBeenCalledWith(mockArts);
    expect(generateExcelWithKeysUtil).toHaveBeenCalledWith(mockExcelData);
    expect(responseStatus.code).toBe(200);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(responseHeaders["Content-Length"]).toBe(mockBuffer.length);

    const contentDisposition = responseHeaders["Content-Disposition"] as string;
    expect(contentDisposition).toContain(`attachment; filename="${mockFileName}"`);
    expect(contentDisposition).toContain(`filename*=UTF-8''${encodeURIComponent(mockFileName)}`);
    expect(responseBody).toBe(mockBuffer);
  });

  it("404: возвращает ошибку если нет артикулов", async () => {
    vi.mocked(getArtsForExportWithKeysUtil).mockResolvedValue([]);

    const req = {} as Request;
    await exportArtsToExcelWithKeysController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({ message: "No arts found to export" });
    expect(formatArtsForExcelWithKeysUtil).not.toHaveBeenCalled();
    expect(generateExcelWithKeysUtil).not.toHaveBeenCalled();
  });

  it("500: возвращает server error при сбое", async () => {
    vi.mocked(getArtsForExportWithKeysUtil).mockRejectedValue(
      new Error("Database error")
    );

    const req = {} as Request;
    await exportArtsToExcelWithKeysController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseBody).toMatchObject({
      message: "Server error",
    });
  });
});

