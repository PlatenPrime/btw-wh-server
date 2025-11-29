import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportArtsToExcelWithStocksController } from "../export-arts-to-excel-with-stocks/exportArtsToExcelWithStocksController.js";
import { formatArtsForExcelExtendedUtil } from "../export-arts-to-excel-with-stocks/utils/formatArtsForExcelExtendedUtil.js";
import { generateExcelExtendedUtil } from "../export-arts-to-excel-with-stocks/utils/generateExcelExtendedUtil.js";
import { getArtsForExportExtendedUtil } from "../export-arts-to-excel-with-stocks/utils/getArtsForExportExtendedUtil.js";
import { getPosesQuantByArtikulUtil } from "../export-arts-to-excel-with-stocks/utils/getPosesQuantByArtikulUtil.js";
// Мокаем утилиты
vi.mock("../export-arts-to-excel-with-stocks/utils/getArtsForExportExtendedUtil.js");
vi.mock("../export-arts-to-excel-with-stocks/utils/getPosesQuantByArtikulUtil.js");
vi.mock("../export-arts-to-excel-with-stocks/utils/formatArtsForExcelExtendedUtil.js");
vi.mock("../export-arts-to-excel-with-stocks/utils/generateExcelExtendedUtil.js");
describe("exportArtsToExcelWithStocksController", () => {
    let res;
    let responseStatus;
    let responseHeaders;
    let responseBody;
    let headersSent;
    beforeEach(() => {
        responseStatus = {};
        responseHeaders = {};
        responseBody = null;
        headersSent = false;
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseBody = data;
                return this;
            },
            send: function (data) {
                responseBody = data;
                return this;
            },
            setHeader: function (name, value) {
                responseHeaders[name] = value;
                return this;
            },
            headersSent: false,
        };
        vi.clearAllMocks();
    });
    it("200: успешный экспорт артикулов с запасами", async () => {
        const mockArts = [
            {
                _id: {},
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
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-02"),
            },
        ];
        const mockPosesQuantMap = new Map();
        mockPosesQuantMap.set("ART-001", 20);
        const mockExcelData = [
            {
                Артикул: "ART-001",
                Факт: "",
                Вітрина: 30,
                Сайт: 50,
                Склад: 20,
                "Назва (укр)": "Тест 1",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                "Дата зрізу": "15.01.2024",
            },
        ];
        const mockBuffer = Buffer.from("mock-excel-data");
        const mockFileName = "arts_export_with_stocks_2024-01-15.xlsx";
        vi.mocked(getArtsForExportExtendedUtil).mockResolvedValue(mockArts);
        vi.mocked(getPosesQuantByArtikulUtil).mockResolvedValue(mockPosesQuantMap);
        vi.mocked(formatArtsForExcelExtendedUtil).mockReturnValue(mockExcelData);
        vi.mocked(generateExcelExtendedUtil).mockReturnValue({
            buffer: mockBuffer,
            fileName: mockFileName,
        });
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        expect(getArtsForExportExtendedUtil).toHaveBeenCalledTimes(1);
        expect(getPosesQuantByArtikulUtil).toHaveBeenCalledTimes(1);
        expect(formatArtsForExcelExtendedUtil).toHaveBeenCalledWith(mockArts, mockPosesQuantMap);
        expect(generateExcelExtendedUtil).toHaveBeenCalledWith(mockExcelData);
        expect(responseStatus.code).toBe(200);
        expect(responseHeaders["Content-Type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(responseHeaders["Content-Disposition"]).toBe(`attachment; filename="${mockFileName}"`);
        expect(responseHeaders["Content-Length"]).toBe(mockBuffer.length);
        expect(responseBody).toBe(mockBuffer);
    });
    it("404: артикулы не найдены", async () => {
        vi.mocked(getArtsForExportExtendedUtil).mockResolvedValue([]);
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        expect(getArtsForExportExtendedUtil).toHaveBeenCalledTimes(1);
        expect(getPosesQuantByArtikulUtil).not.toHaveBeenCalled();
        expect(formatArtsForExcelExtendedUtil).not.toHaveBeenCalled();
        expect(generateExcelExtendedUtil).not.toHaveBeenCalled();
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({
            message: "No arts found to export",
        });
    });
    it("404: артикулы null", async () => {
        vi.mocked(getArtsForExportExtendedUtil).mockResolvedValue(null);
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({
            message: "No arts found to export",
        });
    });
    it("500: ошибка сервера при получении артикулов", async () => {
        const error = new Error("Database error");
        vi.mocked(getArtsForExportExtendedUtil).mockRejectedValue(error);
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseBody.message).toBe("Server error");
        expect(responseBody.error).toBeDefined();
    });
    it("500: ошибка сервера при получении запасов", async () => {
        const mockArts = [
            {
                _id: {},
                artikul: "ART-001",
                zone: "A1",
            },
        ];
        const error = new Error("Poses aggregation error");
        vi.mocked(getArtsForExportExtendedUtil).mockResolvedValue(mockArts);
        vi.mocked(getPosesQuantByArtikulUtil).mockRejectedValue(error);
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseBody.message).toBe("Server error");
    });
    it("500: ошибка сервера при форматировании данных", async () => {
        const mockArts = [
            {
                _id: {},
                artikul: "ART-001",
                zone: "A1",
            },
        ];
        const mockPosesQuantMap = new Map();
        const error = new Error("Format error");
        vi.mocked(getArtsForExportExtendedUtil).mockResolvedValue(mockArts);
        vi.mocked(getPosesQuantByArtikulUtil).mockResolvedValue(mockPosesQuantMap);
        vi.mocked(formatArtsForExcelExtendedUtil).mockImplementation(() => {
            throw error;
        });
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseBody.message).toBe("Server error");
    });
    it("500: ошибка сервера при генерации Excel", async () => {
        const mockArts = [
            {
                _id: {},
                artikul: "ART-001",
                zone: "A1",
            },
        ];
        const mockPosesQuantMap = new Map();
        const mockExcelData = [];
        const error = new Error("Excel generation error");
        vi.mocked(getArtsForExportExtendedUtil).mockResolvedValue(mockArts);
        vi.mocked(getPosesQuantByArtikulUtil).mockResolvedValue(mockPosesQuantMap);
        vi.mocked(formatArtsForExcelExtendedUtil).mockReturnValue(mockExcelData);
        vi.mocked(generateExcelExtendedUtil).mockImplementation(() => {
            throw error;
        });
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseBody.message).toBe("Server error");
    });
    it("500: не отправляет ответ если заголовки уже отправлены", async () => {
        const error = new Error("Error after headers sent");
        res.headersSent = true;
        vi.mocked(getArtsForExportExtendedUtil).mockRejectedValue(error);
        const req = {};
        await exportArtsToExcelWithStocksController(req, res);
        // Проверяем что responseBody не был установлен (не было вызова json)
        expect(responseBody).toBeNull();
    });
});
