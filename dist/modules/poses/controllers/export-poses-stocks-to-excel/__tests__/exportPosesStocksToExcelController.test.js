import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { exportPosesStocksToExcelController } from "../exportPosesStocksToExcelController.js";
import { formatPosesStocksForExcelUtil } from "../utils/formatPosesStocksForExcelUtil.js";
import { generateExcelUtil } from "../utils/generateExcelUtil.js";
import { getPosesStocksForExportUtil } from "../utils/getPosesStocksForExportUtil.js";
vi.mock("../utils/getPosesStocksForExportUtil.js");
vi.mock("../utils/formatPosesStocksForExcelUtil.js");
vi.mock("../utils/generateExcelUtil.js");
describe("exportPosesStocksToExcelController", () => {
    let res;
    let responseStatus;
    let responseHeaders;
    let responseBody;
    beforeEach(async () => {
        await Event.deleteMany({});
        responseStatus = {};
        responseHeaders = {};
        responseBody = null;
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseBody = data;
                return this;
            },
            send(data) {
                responseBody = data;
                return this;
            },
            setHeader(name, value) {
                responseHeaders[name] = value;
                return this;
            },
            headersSent: false,
        };
        vi.clearAllMocks();
    });
    it("200: exports poses stocks to Excel", async () => {
        const mockPoses = [
            { artikul: "ART-001", nameukr: "Товар", quant: 5, sklad: "merezhi" },
        ];
        const mockExcelData = [
            {
                Артикул: "ART-001",
                "Название (укр)": "Товар",
                Склад: "Мережі",
                Количество: 5,
            },
        ];
        const mockBuffer = Buffer.from("mock-excel");
        const mockFileName = "poses_stocks_merezhi_2026-06-07.xlsx";
        vi.mocked(getPosesStocksForExportUtil).mockResolvedValue(mockPoses);
        vi.mocked(formatPosesStocksForExcelUtil).mockReturnValue(mockExcelData);
        vi.mocked(generateExcelUtil).mockResolvedValue({
            buffer: mockBuffer,
            fileName: mockFileName,
        });
        const req = { body: { sklad: "merezhi" } };
        await exportPosesStocksToExcelController(req, res);
        expect(getPosesStocksForExportUtil).toHaveBeenCalledWith("merezhi");
        expect(formatPosesStocksForExcelUtil).toHaveBeenCalledWith(mockPoses, {
            selectedSklad: "merezhi",
        });
        expect(responseStatus.code).toBe(200);
        expect(responseHeaders["Content-Type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(responseHeaders["Content-Disposition"]).toBe(`attachment; filename="${mockFileName}"`);
        expect(responseBody).toBe(mockBuffer);
    });
    it("200: creates audit event when req.user is present", async () => {
        const user = await createTestUser({
            username: `export-event-${Date.now()}`,
        });
        const mockPoses = [
            { artikul: "ART-001", nameukr: "Товар", quant: 5, sklad: "merezhi" },
        ];
        const mockBuffer = Buffer.from("mock-excel");
        const mockFileName = "poses_stocks_merezhi_2026-06-07.xlsx";
        vi.mocked(getPosesStocksForExportUtil).mockResolvedValue(mockPoses);
        vi.mocked(formatPosesStocksForExcelUtil).mockReturnValue([]);
        vi.mocked(generateExcelUtil).mockResolvedValue({
            buffer: mockBuffer,
            fileName: mockFileName,
        });
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
            body: { sklad: "merezhi" },
        };
        await exportPosesStocksToExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "poses" });
        expect(events).toHaveLength(1);
        expect(events[0].description).toContain("Експортовано залишки");
        expect(events[0].description).toContain("склад=merezhi");
    });
    it("400: invalid request body", async () => {
        const req = { body: { sklad: "invalid" } };
        await exportPosesStocksToExcelController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody).toMatchObject({
            message: "Неверные данные тела запроса",
        });
    });
    it("404: no poses with stocks", async () => {
        vi.mocked(getPosesStocksForExportUtil).mockResolvedValue([]);
        const req = { body: {} };
        await exportPosesStocksToExcelController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toMatchObject({
            message: "Нет позиций с остатками для экспорта",
        });
    });
});
